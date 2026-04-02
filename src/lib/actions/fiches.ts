'use server';

import { createClient } from '@/lib/supabase/server';

export interface ServiceConflictInput {
  operator_id: string;
  operator_name: string;
  start_time: string; // ISO string
  end_time: string;   // ISO string
}

/**
 * Validates that the proposed fiche does not cause scheduling conflicts:
 * 1. Client must not have another active appointment overlapping the total time range.
 * 2. Each operator must not be assigned to another active service overlapping their slot.
 *
 * Returns an empty object on success, or { error: string } on conflict.
 * Pass `excludeFicheId` when editing an existing fiche to exclude it from the check.
 */
export async function validateFicheConflicts(
  clientId: string,
  services: ServiceConflictInput[],
  excludeFicheId?: string,
): Promise<{ error?: string }> {
  if (!services.length) return {};

  const supabase = await createClient();

  const timestamps = services.flatMap((s) => [
    new Date(s.start_time).getTime(),
    new Date(s.end_time).getTime(),
  ]);
  const totalStart = new Date(Math.min(...timestamps)).toISOString();
  const totalEnd = new Date(Math.max(...timestamps)).toISOString();

  // ── 1. Client conflict ──────────────────────────────────────────────────────
  // Find active fiches for this client (exclude 'completed')
  let clientFichesQuery = supabase
    .from('fiches')
    .select('id')
    .eq('client_id', clientId)
    .neq('status', 'completed');

  if (excludeFicheId) {
    clientFichesQuery = clientFichesQuery.neq('id', excludeFicheId);
  }

  const { data: clientFiches, error: clientFichesErr } = await clientFichesQuery;
  if (clientFichesErr) throw new Error(clientFichesErr.message);

  if (clientFiches && clientFiches.length > 0) {
    const ficheIds = clientFiches.map((f) => f.id);

    const { data: clientConflicts, error: clientConflictsErr } = await supabase
      .from('fiche_services')
      .select('id')
      .in('fiche_id', ficheIds)
      // Overlap: existing.start_time < newEnd AND existing.end_time > newStart
      .lt('start_time', totalEnd)
      .gt('end_time', totalStart)
      .limit(1);

    if (clientConflictsErr) throw new Error(clientConflictsErr.message);

    if (clientConflicts && clientConflicts.length > 0) {
      return { error: 'Il cliente ha già un appuntamento in questo orario.' };
    }
  }

  // ── 2. Operator conflicts (per service) ─────────────────────────────────────
  // Gather all active fiche IDs once, then check each operator slot
  let activeFichesQuery = supabase
    .from('fiches')
    .select('id')
    .neq('status', 'completed');

  if (excludeFicheId) {
    activeFichesQuery = activeFichesQuery.neq('id', excludeFicheId);
  }

  const { data: activeFiches, error: activeFichesErr } = await activeFichesQuery;
  if (activeFichesErr) throw new Error(activeFichesErr.message);

  const activeFicheIds = activeFiches?.map((f) => f.id) ?? [];
  if (activeFicheIds.length === 0) return {};

  for (const service of services) {
    if (!service.operator_id) continue;

    const { data: opConflicts, error: opErr } = await supabase
      .from('fiche_services')
      .select('id')
      .eq('operator_id', service.operator_id)
      .in('fiche_id', activeFicheIds)
      .lt('start_time', service.end_time)
      .gt('end_time', service.start_time)
      .limit(1);

    if (opErr) throw new Error(opErr.message);

    if (opConflicts && opConflicts.length > 0) {
      return {
        error: `L'operatore ${service.operator_name} è già occupato in questo orario.`,
      };
    }
  }

  return {};
}
