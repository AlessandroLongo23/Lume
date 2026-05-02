import 'server-only';
import { inngest, importProcessRequested } from '@/lib/inngest/client';
import { getInngestSupabase, type InngestSupabase } from '@/lib/inngest/admin';
import { parseFile } from '@/lib/imports/parseFile';
import { mapClientColumns } from '@/lib/imports/llmMapper';
import { transformRow } from '@/lib/imports/clientImportSchema';

const PREVIEW_ROW_COUNT = 20;

/**
 * Stage 1 of the import pipeline: download the uploaded file, parse it, ask
 * the LLM (or the dictionary fast-path) to map columns, transform a preview,
 * and park the job in `awaiting_review` so the user can confirm.
 *
 * If we can't map the required fields with confidence, the job is pushed to
 * `needs_concierge` and the existing email-the-team flow takes over.
 */
export const processImport = inngest.createFunction(
  {
    id: 'process-import',
    name: 'Process import (parse + map)',
    retries: 2,
    triggers: [importProcessRequested],
  },
  async ({ event, step }) => {
    const { jobId, entity } = event.data;
    const supabase = getInngestSupabase();

    if (entity !== 'clients') {
      await markJob(supabase, jobId, { status: 'failed', failure_reason: `Entity '${entity}' non supportata in v1` });
      return { ok: false, reason: 'unsupported entity' };
    }

    await markJob(supabase, jobId, { status: 'parsing' });

    // Step 1 — read the source file from Storage
    const { headers, rows, sourceFilename } = await step.run('download-and-parse', async () => {
      const { data: job, error } = await supabase
        .from('import_jobs')
        .select('storage_path, source_filename')
        .eq('id', jobId)
        .single();
      if (error || !job) throw new Error(`Import job ${jobId} not found`);

      const { data: blob, error: dlError } = await supabase.storage.from('imports').download(job.storage_path);
      if (dlError || !blob) throw new Error(`Storage download failed: ${dlError?.message}`);

      const buffer = await blob.arrayBuffer();
      const parsed = parseFile(buffer, job.source_filename);
      return { headers: parsed.headers, rows: parsed.rows, sourceFilename: job.source_filename };
    });

    if (rows.length === 0) {
      await markJob(supabase, jobId, { status: 'failed', failure_reason: 'Il file non contiene righe utili.' });
      return { ok: false };
    }

    // Step 2 — column mapping
    const mappingResult = await step.run('map-columns', async () => {
      const result = await mapClientColumns(headers, rows.slice(0, 20));
      return result;
    });

    const hasNameCoverage = mappingResult.mappings.some(
      (m) => m.confidence >= 0.6 && (m.destField === 'firstName' || m.destField === 'fullName'),
    ) && mappingResult.mappings.some(
      (m) => m.confidence >= 0.6 && (m.destField === 'lastName' || m.destField === 'fullName'),
    );

    if (!hasNameCoverage) {
      await markJob(supabase, jobId, {
        status: 'needs_concierge',
        mapping_json: mappingResult,
        failure_reason: 'Impossibile identificare nome e cognome con sufficiente certezza. Il team Lume importerà il file manualmente entro 24 ore.',
      });
      // Fire-and-forget concierge email so the salon doesn't have to re-upload
      await step.run('send-concierge-email', () =>
        forwardToConcierge(supabase, jobId, sourceFilename).catch((err) => {
          console.error('[processImport] concierge forward failed:', err);
        }),
      );
      return { ok: false, status: 'needs_concierge' };
    }

    // Step 3 — transform preview rows
    const preview = rows.slice(0, PREVIEW_ROW_COUNT).map((r, i) => transformRow(r, mappingResult.mappings, i));

    await markJob(supabase, jobId, {
      status: 'awaiting_review',
      total_rows: rows.length,
      mapping_json: mappingResult,
      preview_json: {
        usedLLM: mappingResult.usedLLM,
        warnings: mappingResult.warnings,
        sample: preview,
        previewRowCount: preview.length,
      },
    });

    return { ok: true, totalRows: rows.length, usedLLM: mappingResult.usedLLM };
  },
);

async function markJob(
  supabase: InngestSupabase,
  jobId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from('import_jobs').update(patch).eq('id', jobId);
  if (error) console.error('[processImport] failed to update job:', error);
}

async function forwardToConcierge(
  supabase: InngestSupabase,
  jobId: string,
  sourceFilename: string,
): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.NOTIFICATION_EMAIL) return;
  const { data: job } = await supabase
    .from('import_jobs')
    .select('salon_id, created_by, storage_path, source_size_bytes')
    .eq('id', jobId)
    .single();
  if (!job) return;

  const { data: signed } = await supabase.storage.from('imports').createSignedUrl(job.storage_path, 60 * 60 * 24 * 7);

  const Resend = (await import('resend')).Resend;
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: 'Lume <onboarding@resend.dev>',
    to: [process.env.NOTIFICATION_EMAIL!],
    subject: `[Lume Migration — needs_concierge] salon ${job.salon_id}`,
    text: [
      'Un import automatico non è andato a buon fine — necessita intervento manuale.',
      '',
      `Salon ID:   ${job.salon_id}`,
      `Created by: ${job.created_by}`,
      `Job ID:     ${jobId}`,
      `Filename:   ${sourceFilename}`,
      `Size:       ${job.source_size_bytes ?? 'n/a'} bytes`,
      '',
      `Download (7 giorni): ${signed?.signedUrl ?? '(unavailable)'}`,
    ].join('\n'),
  });
}
