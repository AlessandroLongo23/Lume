import 'server-only';
import { inngest, importCommitRequested } from '@/lib/inngest/client';
import { getInngestSupabase, type InngestSupabase } from '@/lib/inngest/admin';
import { loadParsedFile } from '@/lib/imports/core/loadParsedFile';
import { resolveFkColumns } from '@/lib/imports/core/fkResolver';
import { getEntityConfig, isEntitySupported } from '@/lib/imports/entities/registry';
import type { ColumnMapping, DedupKeyConfig, FailedRow } from '@/lib/imports/entities/types';

const BATCH_SIZE = 500;

/**
 * Stage 2 of the import pipeline: re-parse the source file (Inngest steps are
 * stateless, so we can't carry rows across), apply the user-confirmed column
 * map to every row, dedup against existing rows in the entity's table for this
 * salon, and chunk-insert with row-by-row fallback while streaming progress
 * to `import_jobs`.
 *
 * Direct insert into the entity's table is intentional — bypasses entity
 * routes that auto-create auth users / send welcome emails on a real
 * migration. Owners can invite users individually later if they need accounts.
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
    const mappings: ColumnMapping[] = event.data.mappings.map((m) => ({
      sourceColumn: m.sourceColumn,
      destField: m.destField,
      confidence: m.confidence,
    }));
    const supabase = getInngestSupabase();

    if (!isEntitySupported(entity)) {
      await markJob(supabase, jobId, { status: 'failed', failure_reason: `Entity '${entity}' non supportata` });
      return { ok: false };
    }
    const config = getEntityConfig(entity);

    await markJob(supabase, jobId, { status: 'committing', processed_rows: 0, skipped_rows: 0, failed_rows: 0 });

    // Step 1 — re-parse + transform every row (PDFs use the cached extraction
    // written during processImport — no second LLM call)
    const { transformed, failed } = await step.run('parse-and-transform', async () => {
      const { data: job } = await supabase
        .from('import_jobs')
        .select('storage_path, source_filename')
        .eq('id', jobId)
        .single();
      if (!job) throw new Error(`Import job ${jobId} not found`);

      const parsed = await loadParsedFile(supabase, job, config);

      const t: Record<string, unknown>[] = [];
      const f: FailedRow[] = [];
      for (let i = 0; i < parsed.rows.length; i++) {
        const result = config.transformRow(parsed.rows[i], mappings, i);
        if (result.ok) t.push(result.row as Record<string, unknown>);
        else f.push(result);
      }
      return { transformed: t, failed: f };
    });

    // Step 2 — resolve FK columns (auto-create missing referenced records)
    if (config.fkColumns?.length) {
      await step.run('resolve-fks', async () => {
        await resolveFkColumns(supabase, transformed, config.fkColumns, salonId);
        return { resolved: config.fkColumns!.length };
      });
    }

    // Step 3 — dedup using entity-defined keys
    const { dedupedRows, skipped } = await step.run('dedup', async () => {
      return dedupRows(supabase, transformed, config.dedupKeys, config.table, salonId);
    });

    // Step 4 — chunked insert, streaming progress.
    // Postgres rolls back the WHOLE multi-row INSERT if any single row hits a
    // constraint, so on batch error we retry that batch row-by-row to capture
    // exactly which rows are bad (and let the rest succeed).
    let inserted = 0;
    const insertFailures: FailedRow[] = [];

    for (let offset = 0; offset < dedupedRows.length; offset += BATCH_SIZE) {
      const batch = dedupedRows.slice(offset, offset + BATCH_SIZE);
      const result = await step.run(`insert-batch-${offset}`, async () => {
        const payload = batch.map((r) => config.buildInsertPayload(r as never, { salonId }));
        const { error, count } = await supabase
          .from(config.table)
          .insert(payload, { count: 'exact' });
        if (!error) {
          return { inserted: count ?? batch.length, failures: [] as FailedRow[] };
        }
        console.warn(`[commitImport] batch ${offset} failed (${error.message}), retrying row-by-row`);

        let perRowOk = 0;
        const failures: FailedRow[] = [];
        for (let i = 0; i < batch.length; i++) {
          const row = batch[i];
          const { error: rowError } = await supabase
            .from(config.table)
            .insert(config.buildInsertPayload(row as never, { salonId }));
          if (rowError) {
            failures.push({
              ok: false,
              rowIndex: offset + i,
              reason: `Insert: ${rowError.message}`,
              rawValues: rowToRawValues(row),
              partialRow: row,
            });
          } else {
            perRowOk++;
          }
        }
        return { inserted: perRowOk, failures };
      });

      inserted += result.inserted;
      insertFailures.push(...result.failures);

      await markJob(supabase, jobId, {
        processed_rows: inserted,
        skipped_rows: skipped,
        failed_rows: failed.length + insertFailures.length,
      });
    }

    const allFailures = [...failed, ...insertFailures];
    const finalStatus = allFailures.length === 0 ? 'completed' : 'partial_failure';
    await markJob(supabase, jobId, {
      status: finalStatus,
      processed_rows: inserted,
      skipped_rows: skipped,
      failed_rows: allFailures.length,
      error_log: allFailures.length > 0 ? { rows: allFailures.slice(0, 200) } : null,
      completed_at: new Date().toISOString(),
    });

    return { ok: true, inserted, skipped, failed: allFailures.length };
  },
);

function normalizeKey(value: unknown, normalize: DedupKeyConfig['normalize']): string | null {
  if (value == null || value === '') return null;
  const s = String(value);
  if (normalize === 'lower') return s.toLowerCase();
  if (normalize === 'lower-trim') return s.trim().toLowerCase();
  return s;
}

async function dedupRows(
  supabase: InngestSupabase,
  transformed: Record<string, unknown>[],
  dedupKeys: readonly DedupKeyConfig[],
  table: string,
  salonId: string,
): Promise<{ dedupedRows: Record<string, unknown>[]; skipped: number }> {
  const existingByKey = new Map<string, Set<string>>();
  for (const key of dedupKeys) {
    const candidates = transformed
      .map((r) => normalizeKey(r[key.rowField], key.normalize))
      .filter((v): v is string => v != null && v.length > 0);
    const set = new Set<string>();
    if (candidates.length === 0) {
      existingByKey.set(key.column, set);
      continue;
    }
    for (let i = 0; i < candidates.length; i += 500) {
      const chunk = candidates.slice(i, i + 500);
      const { data } = await supabase.from(table).select(key.column).eq('salon_id', salonId).in(key.column, chunk);
      for (const r of (data ?? []) as unknown as Record<string, unknown>[]) {
        const norm = normalizeKey(r[key.column], key.normalize);
        if (norm) set.add(norm);
      }
    }
    existingByKey.set(key.column, set);
  }

  const seenByKey = new Map<string, Set<string>>();
  for (const key of dedupKeys) seenByKey.set(key.column, new Set());

  const out: Record<string, unknown>[] = [];
  let skippedCount = 0;
  for (const r of transformed) {
    let isDup = false;
    for (const key of dedupKeys) {
      const norm = normalizeKey(r[key.rowField], key.normalize);
      if (!norm) continue;
      const existing = existingByKey.get(key.column)!;
      const seen = seenByKey.get(key.column)!;
      if (existing.has(norm) || seen.has(norm)) {
        isDup = true;
        break;
      }
    }
    if (isDup) {
      skippedCount++;
      continue;
    }
    for (const key of dedupKeys) {
      const norm = normalizeKey(r[key.rowField], key.normalize);
      if (norm) seenByKey.get(key.column)!.add(norm);
    }
    out.push(r);
  }
  return { dedupedRows: out, skipped: skippedCount };
}

async function markJob(
  supabase: InngestSupabase,
  jobId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from('import_jobs').update(patch).eq('id', jobId);
  if (error) console.error('[commitImport] failed to update job:', error);
}

function rowToRawValues(r: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(r)) {
    out[k] = v == null ? '' : String(v);
  }
  return out;
}
