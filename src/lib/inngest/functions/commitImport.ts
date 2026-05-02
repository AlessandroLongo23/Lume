import 'server-only';
import { inngest, importCommitRequested } from '@/lib/inngest/client';
import { getInngestSupabase, type InngestSupabase } from '@/lib/inngest/admin';
import { parseFile } from '@/lib/imports/parseFile';
import { transformRow, type ClientInsertRow, type FailedRow } from '@/lib/imports/clientImportSchema';
import type { ColumnMapping } from '@/lib/imports/llmMapper';
import type { ClientDestField } from '@/lib/imports/clientHeaderDictionary';

const BATCH_SIZE = 500;

/**
 * Stage 2 of the import pipeline: re-parse the source file (Inngest steps are
 * stateless, so we can't carry rows across), apply the user-confirmed column
 * map to every row, dedup against existing clients in this salon, and bulk
 * insert in chunks while streaming progress to `import_jobs`.
 *
 * Direct insert into `clients` with `user_id: null` — bypassing /api/clients
 * is intentional. The POST handler creates an auth.users row per client which
 * would trigger thousands of welcome emails on a real migration. Owners can
 * invite individual clients later if they need app accounts.
 */
export const commitImport = inngest.createFunction(
  {
    id: 'commit-import',
    name: 'Commit import (dedup + bulk insert)',
    retries: 1,
    triggers: [importCommitRequested],
  },
  async ({ event, step }) => {
    const { jobId, salonId, entity } = event.data;
    // The wire-format mappings have `destField: string | null`; narrow to our
    // domain enum here so transformRow can rely on the type.
    const mappings: ColumnMapping[] = event.data.mappings.map((m) => ({
      sourceColumn: m.sourceColumn,
      destField: m.destField as ClientDestField | null,
      confidence: m.confidence,
    }));
    const supabase = getInngestSupabase();

    if (entity !== 'clients') {
      await markJob(supabase, jobId, { status: 'failed', failure_reason: `Entity '${entity}' non supportata in v1` });
      return { ok: false };
    }

    await markJob(supabase, jobId, { status: 'committing', processed_rows: 0, skipped_rows: 0, failed_rows: 0 });

    // Step 1 — re-parse + transform every row
    const { transformed, failed } = await step.run('parse-and-transform', async () => {
      const { data: job } = await supabase
        .from('import_jobs')
        .select('storage_path, source_filename')
        .eq('id', jobId)
        .single();
      if (!job) throw new Error(`Import job ${jobId} not found`);

      const { data: blob, error: dlError } = await supabase.storage.from('imports').download(job.storage_path);
      if (dlError || !blob) throw new Error(`Storage download failed: ${dlError?.message}`);

      const buffer = await blob.arrayBuffer();
      const parsed = parseFile(buffer, job.source_filename);

      const t: ClientInsertRow[] = [];
      const f: FailedRow[] = [];
      for (let i = 0; i < parsed.rows.length; i++) {
        const result = transformRow(parsed.rows[i], mappings, i);
        if (result.ok) t.push(result.row);
        else f.push(result);
      }
      return { transformed: t, failed: f };
    });

    // Step 2 — dedup against existing clients (email + phoneNumber) for this salon
    const { dedupedRows, skipped } = await step.run('dedup', async () => {
      const emails = transformed.map((r) => r.email).filter((e): e is string => !!e);
      const phones = transformed.map((r) => r.phoneNumber).filter((p): p is string => !!p);

      const existingEmails = new Set<string>();
      const existingPhones = new Set<string>();

      if (emails.length > 0) {
        const { data: existing } = await supabase
          .from('clients')
          .select('email')
          .eq('salon_id', salonId)
          .in('email', emails);
        for (const r of existing ?? []) {
          if (r.email) existingEmails.add(r.email.toLowerCase());
        }
      }
      if (phones.length > 0) {
        const { data: existing } = await supabase
          .from('clients')
          .select('phoneNumber')
          .eq('salon_id', salonId)
          .in('phoneNumber', phones);
        for (const r of existing ?? []) {
          if (r.phoneNumber) existingPhones.add(r.phoneNumber);
        }
      }

      const seenInBatchEmail = new Set<string>();
      const seenInBatchPhone = new Set<string>();
      const out: ClientInsertRow[] = [];
      let skippedCount = 0;
      for (const r of transformed) {
        const e = r.email?.toLowerCase() ?? null;
        const p = r.phoneNumber ?? null;
        if (e && (existingEmails.has(e) || seenInBatchEmail.has(e))) { skippedCount++; continue; }
        if (p && (existingPhones.has(p) || seenInBatchPhone.has(p))) { skippedCount++; continue; }
        if (e) seenInBatchEmail.add(e);
        if (p) seenInBatchPhone.add(p);
        out.push(r);
      }
      return { dedupedRows: out, skipped: skippedCount };
    });

    // Step 3 — chunked insert, streaming progress
    let inserted = 0;
    let insertFailed = 0;
    for (let offset = 0; offset < dedupedRows.length; offset += BATCH_SIZE) {
      const batch = dedupedRows.slice(offset, offset + BATCH_SIZE);
      const result = await step.run(`insert-batch-${offset}`, async () => {
        const payload = batch.map((r) => ({
          salon_id: salonId,
          user_id: null,
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
          phonePrefix: r.phonePrefix,
          phoneNumber: r.phoneNumber,
          gender: r.gender,
          birthDate: r.birthDate,
          isTourist: r.isTourist ?? false,
          note: r.note,
        }));
        const { error, count } = await supabase
          .from('clients')
          .insert(payload, { count: 'exact' });
        if (error) {
          console.error(`[commitImport] batch ${offset} insert error:`, error.message);
          return { inserted: 0, failed: batch.length, error: error.message };
        }
        return { inserted: count ?? batch.length, failed: 0 };
      });

      inserted += result.inserted;
      insertFailed += result.failed;

      await markJob(supabase, jobId, {
        processed_rows: inserted,
        skipped_rows: skipped,
        failed_rows: failed.length + insertFailed,
      });
    }

    const finalStatus = (failed.length + insertFailed) === 0 ? 'completed' : 'partial_failure';
    await markJob(supabase, jobId, {
      status: finalStatus,
      processed_rows: inserted,
      skipped_rows: skipped,
      failed_rows: failed.length + insertFailed,
      error_log: failed.length > 0 ? { rows: failed.slice(0, 200) } : null, // cap stored rows
      completed_at: new Date().toISOString(),
    });

    return { ok: true, inserted, skipped, failed: failed.length + insertFailed };
  },
);

async function markJob(
  supabase: InngestSupabase,
  jobId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from('import_jobs').update(patch).eq('id', jobId);
  if (error) console.error('[commitImport] failed to update job:', error);
}
