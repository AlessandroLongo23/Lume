import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeNameKey } from './transforms';
import type { FkColumnConfig } from '../entities/types';

/**
 * Resolves foreign-key columns by auto-creating missing referenced records.
 *
 * For each FkColumnConfig we:
 *   1. Collect the distinct (normalized) names referenced by the input rows
 *      under `fk.sourceField` (e.g. 'manufacturerName').
 *   2. Fetch all existing FK records for the salon (one query per FK table —
 *      these reference tables are typically small: categories, brands, …).
 *   3. Bulk-insert any names that don't yet exist, using the first-seen
 *      original spelling (so 'WELLA' and 'wella' fold into a single record
 *      with the original casing of whichever showed up first).
 *   4. Substitute `fk.targetField` (e.g. 'manufacturer_id') on each row with
 *      the resolved id, then drop the source name field so it doesn't end up
 *      in the insert payload.
 *
 * Mutates `rows` in place. Throws on bulk-insert failure — runCommit catches
 * and marks the job `failed`.
 */
export async function resolveFkColumns(
  supabase: SupabaseClient,
  rows: Record<string, unknown>[],
  fkColumns: readonly FkColumnConfig[] | undefined,
  salonId: string,
): Promise<void> {
  if (!fkColumns || fkColumns.length === 0 || rows.length === 0) return;
  for (const fk of fkColumns) {
    await resolveSingle(supabase, rows, fk, salonId);
  }
}

async function resolveSingle(
  supabase: SupabaseClient,
  rows: Record<string, unknown>[],
  fk: FkColumnConfig,
  salonId: string,
): Promise<void> {
  // 1. Collect normalized names referenced by the rows + remember an original
  //    spelling for each (the first one we see, used when we have to insert).
  const referenced = new Set<string>();
  const originalByNorm = new Map<string, string>();
  for (const r of rows) {
    const v = r[fk.sourceField];
    if (typeof v !== 'string') continue;
    const norm = normalizeNameKey(v);
    if (!norm) continue;
    referenced.add(norm);
    if (!originalByNorm.has(norm)) originalByNorm.set(norm, v.trim());
  }
  if (referenced.size === 0) {
    // No references on any row — clear the source field on all rows and bail
    for (const r of rows) delete r[fk.sourceField];
    return;
  }

  // 2. Fetch existing records for the salon.
  // We pull all of them rather than filtering by name — these tables are small
  // (typically <200 rows per salon for categories/brands/suppliers) and it
  // lets us do case-insensitive matching client-side without N round-trips.
  const idByNorm = new Map<string, string>();
  const { data: existing, error: fetchErr } = await supabase
    .from(fk.table)
    .select(`id, ${fk.matchField}`)
    .eq('salon_id', salonId);
  if (fetchErr) throw new Error(`FK fetch failed for ${fk.table}: ${fetchErr.message}`);
  for (const r of (existing ?? []) as unknown as Record<string, unknown>[]) {
    const id = r.id as string | undefined;
    const norm = normalizeNameKey(r[fk.matchField] as string | undefined);
    if (norm && id) idByNorm.set(norm, id);
  }

  // 3. Bulk-insert anything that's still missing.
  const toCreate = Array.from(referenced).filter((n) => !idByNorm.has(n));
  if (toCreate.length > 0) {
    const inserts = toCreate.map((norm) => ({
      salon_id: salonId,
      [fk.matchField]: originalByNorm.get(norm) ?? norm,
    }));
    const { data: inserted, error: insErr } = await supabase
      .from(fk.table)
      .insert(inserts)
      .select(`id, ${fk.matchField}`);
    if (insErr) throw new Error(`FK auto-create failed for ${fk.table}: ${insErr.message}`);
    for (const r of (inserted ?? []) as unknown as Record<string, unknown>[]) {
      const id = r.id as string | undefined;
      const norm = normalizeNameKey(r[fk.matchField] as string | undefined);
      if (norm && id) idByNorm.set(norm, id);
    }
  }

  // 4. Substitute the FK id on each row, then drop the source name field.
  for (const r of rows) {
    const v = r[fk.sourceField];
    const norm = typeof v === 'string' ? normalizeNameKey(v) : '';
    r[fk.targetField] = norm ? (idByNorm.get(norm) ?? null) : null;
    delete r[fk.sourceField];
  }
}
