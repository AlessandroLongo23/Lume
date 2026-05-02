import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { loadParsedFile } from './loadParsedFile';
import { mapColumns, type MappingResult } from './llmMapper';
import { smartMapColumns } from './smartMapper';
import { getEntityConfig } from '../entities/registry';

const PREVIEW_ROW_COUNT = 20;

export type SupabaseAdmin = ReturnType<typeof createAdminClient>;

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Stage 1 of the import pipeline. Runs synchronously inside the API route
 * (after() boundary), updating the import_jobs row as it progresses so the
 * UI can stream state via Supabase Realtime.
 *
 * Entity-agnostic: dispatches to the matching EntityImportConfig via the
 * registry. If column mapping can't satisfy the config's required fields
 * with confidence, the job is handed off to the existing concierge email
 * flow so the salon never gets stuck.
 */
export async function runProcessImport(jobId: string): Promise<void> {
  const supabase = createAdminClient();
  const log = (msg: string, meta?: Record<string, unknown>) =>
    console.log(`[runProcessImport ${jobId.slice(0, 8)}] ${msg}`, meta ?? '');

  try {
    log('start');
    await markJob(supabase, jobId, { status: 'parsing' });

    // 1. Download + parse
    const { data: job, error: jobErr } = await supabase
      .from('import_jobs')
      .select('storage_path, source_filename, entity, salon_id, created_by, source_size_bytes')
      .eq('id', jobId)
      .single();
    if (jobErr || !job) throw new Error(`job ${jobId} not found: ${jobErr?.message}`);

    const config = getEntityConfig(job.entity);

    const parsed = await loadParsedFile(supabase, job, config);
    log('parsed', { rows: parsed.rows.length, headers: parsed.headers.length, entity: job.entity });

    if (parsed.rows.length === 0) {
      await markJob(supabase, jobId, { status: 'failed', failure_reason: 'Il file non contiene righe utili.' });
      return;
    }

    // 2. Column mapping. Entities that opt into smart mode (products, services)
    //    send the full row data to Claude so it can detect splits like
    //    "Prezzo vendita / Non in vendita" → sellPrice + isForRetail. Others
    //    use the GDPR-bounded header-only flow (5 sample values per column).
    let mappingResult: MappingResult;
    if (config.smartModeEnabled) {
      try {
        mappingResult = await smartMapColumns(parsed.headers, parsed.rows, config);
        log('smart-mapped', {
          mappings: mappingResult.mappings.length,
          smartTransforms: mappingResult.mappings.filter((m) => m.smartTransform).length,
        });
      } catch (err) {
        log('smart mapping failed — falling back to simple mapper', { err: String(err) });
        mappingResult = await mapColumns(parsed.headers, parsed.rows.slice(0, 20), config);
        log('mapped (fallback)', { usedLLM: mappingResult.usedLLM, mappings: mappingResult.mappings.length });
      }
    } else {
      mappingResult = await mapColumns(parsed.headers, parsed.rows.slice(0, 20), config);
      log('mapped', { usedLLM: mappingResult.usedLLM, mappings: mappingResult.mappings.length });
    }

    if (!config.hasRequiredCoverage(mappingResult.mappings)) {
      log('no required-field coverage — routing to concierge');
      await markJob(supabase, jobId, {
        status: 'needs_concierge',
        mapping_json: mappingResult,
        failure_reason: `${config.insufficientMappingReason} Il team Lume importerà il file manualmente entro 24 ore.`,
      });
      await forwardToConcierge(supabase, jobId, job.source_filename).catch((err) => log('concierge forward failed', { err: String(err) }));
      return;
    }

    // 3. Build a 20-row preview using the same transform pipeline that commit will use
    const preview = parsed.rows.slice(0, PREVIEW_ROW_COUNT).map((r, i) => config.transformRow(r, mappingResult.mappings, i));
    const sourceSample = parsed.rows.slice(0, PREVIEW_ROW_COUNT);

    await markJob(supabase, jobId, {
      status: 'awaiting_review',
      total_rows: parsed.rows.length,
      mapping_json: mappingResult,
      preview_json: {
        usedLLM: mappingResult.usedLLM,
        warnings: mappingResult.warnings,
        sample: preview,
        sourceSample,
        previewRowCount: preview.length,
      },
    });
    log('done — awaiting_review', { total: parsed.rows.length, previewOk: preview.filter((p) => p.ok).length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[runProcessImport ${jobId.slice(0, 8)}] FAILED:`, msg);
    await markJob(supabase, jobId, { status: 'failed', failure_reason: msg }).catch(() => {});
  }
}

async function markJob(supabase: SupabaseAdmin, jobId: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('import_jobs').update(patch).eq('id', jobId);
  if (error) console.error('[runProcessImport] markJob error:', error.message);
}

async function forwardToConcierge(supabase: SupabaseAdmin, jobId: string, sourceFilename: string): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.NOTIFICATION_EMAIL) return;
  const { data: job } = await supabase
    .from('import_jobs')
    .select('salon_id, created_by, storage_path, source_size_bytes, entity')
    .eq('id', jobId)
    .single();
  if (!job) return;
  const { data: signed } = await supabase.storage.from('imports').createSignedUrl(job.storage_path, 60 * 60 * 24 * 7);

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: 'Lume <onboarding@resend.dev>',
    to: [process.env.NOTIFICATION_EMAIL!],
    subject: `[Lume Migration — needs_concierge] salon ${job.salon_id}`,
    text: [
      "Un import automatico non è andato a buon fine — necessita intervento manuale.",
      '',
      `Salon ID:   ${job.salon_id}`,
      `Created by: ${job.created_by}`,
      `Job ID:     ${jobId}`,
      `Entity:     ${job.entity}`,
      `Filename:   ${sourceFilename}`,
      `Size:       ${job.source_size_bytes ?? 'n/a'} bytes`,
      '',
      `Download (7 giorni): ${signed?.signedUrl ?? '(unavailable)'}`,
    ].join('\n'),
  });
}
