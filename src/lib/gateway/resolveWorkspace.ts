import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { GatewayResult, WorkspaceContext } from '@/lib/types/Workspace';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days — mirrors /api/platform/enter-salon

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

  // Super-admin short-circuit: platform owners bypass tenant routing entirely.
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_super_admin')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.is_super_admin) {
    // The super_admin_impersonation table is the source of truth for RLS. The
    // cookies are fast-path UI hints that should mirror it. If they disagree
    // (legacy cookies left over from before this table existed, a stale
    // httpOnly cookie surviving a logout, direct DB edits, etc.), trust the
    // table and resync the cookies to match.
    const cookieStore = await cookies();
    const cookieSalonId = cookieStore.get('lume-active-salon-id')?.value ?? null;
    const cookieImpersonating = cookieStore.get('lume-impersonating')?.value === '1';

    const { data: imp } = await supabaseAdmin
      .from('super_admin_impersonation')
      .select('salon_id')
      .eq('user_id', userId)
      .maybeSingle();

    const tableSalonId: string | null = imp?.salon_id ?? null;
    const isImpersonating = !!tableSalonId;

    if (isImpersonating) {
      if (cookieSalonId !== tableSalonId) {
        cookieStore.set('lume-active-salon-id', tableSalonId, {
          httpOnly: true,
          secure:   process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path:     '/',
          maxAge:   COOKIE_MAX_AGE,
        });
      }
      if (!cookieImpersonating) {
        cookieStore.set('lume-impersonating', '1', {
          httpOnly: false,
          secure:   process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path:     '/',
          maxAge:   COOKIE_MAX_AGE,
        });
      }
    } else if (cookieSalonId || cookieImpersonating) {
      cookieStore.delete('lume-active-salon-id');
      cookieStore.delete('lume-impersonating');
    }

    return {
      businessContexts: [],
      clientContexts:   [],
      redirect:         isImpersonating ? '/admin/calendario' : '/platform',
      activeSalonId:    tableSalonId,
      isSuperAdmin:     true,
    };
  }

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
