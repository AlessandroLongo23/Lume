'use server';

import { createClient } from '@/lib/supabase/server';
import { FicheStatus } from '@/lib/types/ficheStatus';

/** Completed and cancelled fiches no longer hold their slot. */
const INACTIVE_STATUSES = `(${FicheStatus.COMPLETED},${FicheStatus.CANCELLED})`;

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
  // Overlap: existing.start_time < newEnd AND existing.end_time > newStart.
  // fiche_services has two foreign keys to fiches, so the embeds name the canonical one.
  let clientConflictsQuery = supabase
    .from('fiche_services')
    .select('id, fiches!fiche_services_fiche_id_fkey!inner(client_id, status)')
    .eq('fiches.client_id', clientId)
    .not('fiches.status', 'in', INACTIVE_STATUSES)
    .lt('start_time', totalEnd)
    .gt('end_time', totalStart)
    .limit(1);
  if (excludeFicheId) clientConflictsQuery = clientConflictsQuery.neq('fiche_id', excludeFicheId);

  const { data: clientConflicts, error: clientConflictsErr } = await clientConflictsQuery;
  if (clientConflictsErr) throw new Error(clientConflictsErr.message);

  if (clientConflicts.length > 0) {
    return { error: 'Il cliente ha già un appuntamento in questo orario.' };
  }

  // ── 2. Operator conflicts (per service) ─────────────────────────────────────
  for (const service of services) {
    if (!service.operator_id) continue;

    let opConflictsQuery = supabase
      .from('fiche_services')
      .select('id, start_time, end_time, fiches!fiche_services_fiche_id_fkey!inner(status)')
      .eq('operator_id', service.operator_id)
      .not('fiches.status', 'in', INACTIVE_STATUSES)
      .lt('start_time', service.end_time)
      .gt('end_time', service.start_time)
      .limit(1);
    if (excludeFicheId) opConflictsQuery = opConflictsQuery.neq('fiche_id', excludeFicheId);

    const { data: opConflicts, error: opErr } = await opConflictsQuery;

    if (opErr) throw new Error(opErr.message);

    if (opConflicts && opConflicts.length > 0) {
      const conflict = opConflicts[0];
      const fmt = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
      };
      return {
        error: `L'operatore ${service.operator_name} è già occupato in questo orario (appuntamento esistente: ${fmt(conflict.start_time)} – ${fmt(conflict.end_time)}).`,
      };
    }

    const { data: unavailConflicts, error: unavailErr } = await supabase
      .from('operator_unavailabilities')
      .select('id')
      .eq('operator_id', service.operator_id)
      .lt('start_at', service.end_time)
      .gt('end_at', service.start_time)
      .limit(1);

    if (unavailErr) throw new Error(unavailErr.message);

    if (unavailConflicts && unavailConflicts.length > 0) {
      return {
        error: `L'operatore ${service.operator_name} risulta non disponibile in questo orario.`,
      };
    }
  }

  return {};
}

/**
 * Updates a fiche through the `update_fiche_with_audit` RPC, which validates
 * the patch against a whitelist, applies it, and inserts a `fiche_edits` row
 * with the diff (and optional reason) inside the same transaction.
 *
 * The RPC validates auth via `auth.uid()` itself — we don't need to look up
 * the caller profile here.
 */
export async function updateFicheWithAudit(
  ficheId: string,
  patch: Record<string, unknown>,
  reason?: string | null,
): Promise<{ data?: unknown; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('update_fiche_with_audit', {
    p_fiche_id: ficheId,
    p_patch: patch,
    p_reason: reason ?? null,
  });

  if (error) {
    switch (error.code) {
      case '42501':
        return { error: 'Non sei autorizzato a modificare questa fiche.' };
      case '22023':
        // RPC raises 'Invalid patch fields: {a,b}' — passing the raw list
        // through is more useful to the user than a generic message and
        // saves us from brittle quoted-string parsing.
        return { error: `Campo non modificabile: ${error.message}` };
      case 'P0002':
        return { error: 'Fiche non trovata.' };
      default:
        return { error: 'Impossibile aggiornare la fiche.' };
    }
  }

  return { data };
}
