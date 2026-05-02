import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { loadParsedFile } from './loadParsedFile';
import { resolveFkColumns } from './fkResolver';
import { getEntityConfig } from '../entities/registry';
import type { ColumnMapping, DedupKeyConfig, FailedRow } from '../entities/types';

const PROGRESS_THROTTLE_MS = 250;

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Stage 2 of the import pipeline. Runs synchronously inside the API route
 * (after() boundary). Per-row inserts are intentional — Postgres rolls back
 * the WHOLE multi-row INSERT if any single row violates a constraint, so a
 * single bad row would tank a 500-row batch. Per-row gives us deterministic
 * accounting.
 */
export async function runCommitImport(
  jobId: string,
  rawMappings: ColumnMapping[],
): Promise<void> {
  const supabase = createAdminClient();
  const log = (msg: string, meta?: Record<string, unknown>) =>
    console.log(`[runCommitImport ${jobId.slice(0, 8)}] ${msg}`, meta ?? '');

  // Re-narrow JSON round-trip into the typed shape so smartTransform survives.
  const mappings: ColumnMapping[] = rawMappings.map((m) => ({
    sourceColumn: m.sourceColumn,
    destField: m.destField,
    confidence: m.confidence,
    ...(m.smartTransform ? { smartTransform: m.smartTransform } : {}),
  }));

  try {
    log('start', { mappings: mappings.length });
    await markJob(supabase, jobId, { status: 'committing', processed_rows: 0, skipped_rows: 0, failed_rows: 0, error_log: null });

    // 1. Load + transform every row
    const { data: job, error: jobErr } = await supabase
      .from('import_jobs')
      .select('storage_path, source_filename, salon_id, entity')
      .eq('id', jobId)
      .single();
    if (jobErr || !job) throw new Error(`job ${jobId} not found: ${jobErr?.message}`);

    const config = getEntityConfig(job.entity);
    const salonId = job.salon_id;

    const parsed = await loadParsedFile(supabase, job, config);
    log('parsed', { rows: parsed.rows.length });

    const transformed: Record<string, unknown>[] = [];
    const failures: FailedRow[] = [];
    for (let i = 0; i < parsed.rows.length; i++) {
      const r = config.transformRow(parsed.rows[i], mappings, i);
      if (r.ok) transformed.push(r.row as Record<string, unknown>);
      else failures.push(r);
    }
    log('transformed', { ok: transformed.length, failed: failures.length });

    // 2. Resolve FK columns by auto-creating missing referenced records
    if (config.fkColumns?.length) {
      await resolveFkColumns(supabase, transformed, config.fkColumns, salonId);
      log('fk-resolved', { columns: config.fkColumns.length });
    }

    // 3. Dedup against existing rows in this salon — entity-defined keys
    const { toInsert, skipped } = await dedupRows(supabase, transformed, config.dedupKeys, config.table, salonId);
    log('deduped', { willInsert: toInsert.length, skipped });

    // 4. Insert ROW BY ROW. Slow but bulletproof — one bad row only fails its own row.
    let inserted = 0;
    let lastProgressAt = 0;
    for (let i = 0; i < toInsert.length; i++) {
      const row = toInsert[i];
      const payload = config.buildInsertPayload(row, { salonId });
      const { error: insErr } = await supabase.from(config.table).insert(payload);
      if (insErr) {
        failures.push({
          ok: false,
          rowIndex: -(i + 1), // negative to distinguish post-transform failures
          reason: `Insert: ${insErr.message}`,
          rawValues: rowToRawValues(row),
          partialRow: row,
        });
      } else {
        inserted++;
      }

      const now = Date.now();
      const isLast = i === toInsert.length - 1;
      if (isLast || now - lastProgressAt >= PROGRESS_THROTTLE_MS) {
        lastProgressAt = now;
        await markJob(supabase, jobId, {
          processed_rows: inserted,
          skipped_rows: skipped,
          failed_rows: failures.length,
        });
      }
    }

    const finalStatus = failures.length === 0 ? 'completed' : 'partial_failure';
    await markJob(supabase, jobId, {
      status: finalStatus,
      processed_rows: inserted,
      skipped_rows: skipped,
      failed_rows: failures.length,
      error_log: failures.length > 0 ? { rows: failures.slice(0, 500) } : null,
      completed_at: new Date().toISOString(),
    });
    log('done', { status: finalStatus, inserted, skipped, failed: failures.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[runCommitImport ${jobId.slice(0, 8)}] FAILED:`, msg);
    await markJob(supabase, jobId, { status: 'failed', failure_reason: msg, completed_at: new Date().toISOString() }).catch(() => {});
  }
}

function normalizeKey(value: unknown, normalize: DedupKeyConfig['normalize']): string | null {
  if (value == null || value === '') return null;
  const s = String(value);
  if (normalize === 'lower') return s.toLowerCase();
  if (normalize === 'lower-trim') return s.trim().toLowerCase();
  return s;
}

async function dedupRows<T extends Record<string, unknown>>(
  supabase: SupabaseAdmin,
  transformed: T[],
  dedupKeys: readonly DedupKeyConfig[],
  table: string,
  salonId: string,
): Promise<{ toInsert: T[]; skipped: number }> {
  // Per-key sets of existing values from DB (chunked IN queries)
  const existingByKey = new Map<string, Set<string>>();
  for (const key of dedupKeys) {
    const candidates = transformed
      .map((r) => normalizeKey(r[key.rowField], key.normalize))
      .filter((v): v is string => v != null && v.length > 0);
    if (candidates.length === 0) {
      existingByKey.set(key.column, new Set());
      continue;
    }
    const set = new Set<string>();
    // Chunk to avoid PostgREST URL length limits
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

  const toInsert: T[] = [];
  let skipped = 0;
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
      skipped++;
      continue;
    }
    for (const key of dedupKeys) {
      const norm = normalizeKey(r[key.rowField], key.normalize);
      if (norm) seenByKey.get(key.column)!.add(norm);
    }
    toInsert.push(r);
  }
  return { toInsert, skipped };
}

async function markJob(supabase: SupabaseAdmin, jobId: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('import_jobs').update(patch).eq('id', jobId);
  if (error) console.error('[runCommitImport] markJob error:', error.message);
}

function rowToRawValues(r: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(r)) out[k] = v == null ? '' : String(v);
  return out;
}
