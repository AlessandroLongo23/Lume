import { createClient } from '@supabase/supabase-js';
import type { GatewayResult, WorkspaceContext } from '@/lib/types/Workspace';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Resolves all workspace contexts for a given auth user ID.
 *
 * Runs three DB queries in parallel:
 *  - salons they own (owner_id = userId)
 *  - salons they operate in (operators.user_id = userId)
 *  - salons they are clients of (clients.user_id = userId)
 *
 * Returns a GatewayResult with pre-computed redirect and activeSalonId
 * so callers never need to re-implement the routing logic.
 */
export async function resolveWorkspace(userId: string): Promise<GatewayResult> {
  const supabaseAdmin = getAdminClient();

  const [ownedResult, operatorResult, clientResult] = await Promise.all([
    supabaseAdmin
      .from('salons')
      .select('id, name')
      .eq('owner_id', userId),

    supabaseAdmin
      .from('operators')
      .select('salon_id, salons(id, name)')
      .eq('user_id', userId)
      .is('archived_at', null),

    supabaseAdmin
      .from('clients')
      .select('salon_id, salons(id, name)')
      .eq('user_id', userId),
  ]);

  // --- Build businessContexts (owner takes precedence over operator for same salon) ---
  const businessContexts: WorkspaceContext[] = [];
  const seenSalonIds = new Set<string>();

  for (const salon of ownedResult.data ?? []) {
    businessContexts.push({ type: 'business', salonId: salon.id, salonName: salon.name, role: 'owner' });
    seenSalonIds.add(salon.id);
  }

  for (const row of operatorResult.data ?? []) {
    const salon = row.salons as unknown as { id: string; name: string } | null;
    if (!salon || seenSalonIds.has(salon.id)) continue;
    businessContexts.push({ type: 'business', salonId: salon.id, salonName: salon.name, role: 'operator' });
    seenSalonIds.add(salon.id);
  }

  // --- Build clientContexts ---
  const clientContexts: WorkspaceContext[] = [];

  for (const row of clientResult.data ?? []) {
    const salon = row.salons as unknown as { id: string; name: string } | null;
    if (!salon) continue;
    clientContexts.push({ type: 'client', salonId: salon.id, salonName: salon.name, role: 'client' });
  }

  // --- Compute redirect ---
  const hasBusiness = businessContexts.length > 0;
  const hasClient   = clientContexts.length > 0;

  let redirect: GatewayResult['redirect'];
  let activeSalonId: string | null = null;

  if (hasBusiness && !hasClient) {
    if (businessContexts.length === 1) {
      redirect      = '/admin/calendario';
      activeSalonId = businessContexts[0].salonId;
    } else {
      redirect = '/select-salon';
    }
  } else if (!hasBusiness && hasClient) {
    redirect = '/client-dashboard';
  } else {
    // Both roles, or neither (orphaned user edge case)
    redirect = '/select-workspace';
  }

  return { businessContexts, clientContexts, redirect, activeSalonId };
}
