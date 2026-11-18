'use server';

import { createClient } from '@/lib/supabase/server';
import { FicheStatus } from '@/lib/types/ficheStatus';
import type { Json, Tables } from '@/lib/supabase/types';

/** Completed and cancelled fiches no longer hold their slot. */
const INACTIVE_STATUSES = `(${FicheStatus.COMPLETED},${FicheStatus.CANCELLED})`;

export interface ServiceConflictInput {
  operator_id: string;
  operator_name: string;
  start_time: string; // ISO string
  end_time: string;   // ISO string
}

export interface FicheConflictResult {
  /** A hard conflict: the fiche cannot be saved. */
  error?: string;
  /** An operator is already booked in that time. The fiche can still be saved
   *  once the user confirms, by calling again with `allowOperatorOverlap`. */
  operatorOverlap?: string;
}

/**
 * Validates the proposed fiche against the calendar:
 * 1. The client must not have another active appointment overlapping the total time range (hard).
 * 2. No operator may be unavailable (ferie, assenza) during their service (hard).
 * 3. No operator should already be booked on another active service in their slot (soft:
 *    returned as `operatorOverlap` unless `allowOperatorOverlap` is set).
 *
 * Pass `excludeFicheId` when editing an existing fiche to exclude it from the check.
 */
export async function validateFicheConflicts(
  clientId: string,
  services: ServiceConflictInput[],
  excludeFicheId?: string,
  allowOperatorOverlap = false,
): Promise<FicheConflictResult> {
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

  // ── 2. Operator unavailability (per service) ────────────────────────────────
  for (const service of services) {
    if (!service.operator_id) continue;

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

  if (allowOperatorOverlap) return {};

  // ── 3. Operator already booked (per service) ────────────────────────────────
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
      const fmt = (iso: string) =>
        new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
      return {
        operatorOverlap: `${service.operator_name} ha già un appuntamento dalle ${fmt(conflict.start_time)} alle ${fmt(conflict.end_time)}.`,
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
  patch: { [field: string]: Json | undefined },
  reason?: string | null,
): Promise<{ data?: Tables<'fiches'>; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('update_fiche_with_audit', {
    p_fiche_id: ficheId,
    p_patch: patch,
    p_reason: reason ?? undefined,
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

  // The function returns a public.fiches row, so the same narrowing as Tables<'fiches'> applies.
  return { data: data as Tables<'fiches'> };
}
