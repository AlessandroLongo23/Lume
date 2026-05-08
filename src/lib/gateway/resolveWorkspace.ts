import 'server-only';
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

type SalonJoin = { id: string; name: string; onboarded_at: string | null };

/**
 * Resolves all workspace contexts for a given auth user ID.
 *
 * Source of truth for "which salons does this person belong to" is now
 * public.user_salon_memberships. Client contexts still come from clients.user_id.
 */
export async function resolveWorkspace(userId: string): Promise<GatewayResult> {
  const supabaseAdmin = getAdminClient();

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', userId)
    .maybeSingle<{ is_platform_admin: boolean }>();

  const isAdmin = !!profile?.is_platform_admin;

  const [membershipsResult, clientResult] = await Promise.all([
    supabaseAdmin
      .from('user_salon_memberships')
      .select('salon_id, role, is_primary, salons:salons(id, name, onboarded_at)')
      .eq('user_id', userId)
      .order('joined_at', { ascending: true }),

    supabaseAdmin
      .from('clients')
      .select('salon_id, salons(id, name)')
      .eq('user_id', userId),
  ]);

  // --- Build businessContexts from memberships ---
  const businessContexts: WorkspaceContext[] = [];
  // Track owned-salon onboarding state so a fresh owner with one salon lands
  // in the import wizard rather than the empty calendar.
  const ownedNeedingOnboarding = new Set<string>();

  for (const row of membershipsResult.data ?? []) {
    const salon = row.salons as unknown as SalonJoin | null;
    if (!salon) continue;
    const role = row.role as 'owner' | 'operator';
    businessContexts.push({
      type:      'business',
      salonId:   salon.id,
      salonName: salon.name,
      role,
    });
    if (role === 'owner' && !salon.onboarded_at) {
      ownedNeedingOnboarding.add(salon.id);
    }
  }

  // --- Build clientContexts ---
  const clientContexts: WorkspaceContext[] = [];

  for (const row of clientResult.data ?? []) {
    const salon = row.salons as unknown as { id: string; name: string } | null;
    if (!salon) continue;
    clientContexts.push({ type: 'client', salonId: salon.id, salonName: salon.name, role: 'client' });
  }

  const hasBusiness = businessContexts.length > 0;
  const hasClient   = clientContexts.length > 0;

  if (isAdmin) {
    // The super_admin_impersonation table is the source of truth for RLS. The
    // cookies are fast-path UI hints that should mirror it. Resync if they drift.
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

    // Multi-role admin → show the picker so they can choose where to land.
    if (hasBusiness || hasClient) {
      return {
        businessContexts,
        clientContexts,
        redirect:      '/select-workspace',
        activeSalonId: null,
        isAdmin:       true,
      };
    }

    return {
      businessContexts: [],
      clientContexts:   [],
      redirect:         isImpersonating ? '/admin/calendario' : '/platform',
      activeSalonId:    tableSalonId,
      isAdmin:          true,
    };
  }

  // --- Non-admin routing ---
  let redirect: GatewayResult['redirect'];
  let activeSalonId: string | null = null;

  if (hasBusiness && !hasClient) {
    if (businessContexts.length === 1) {
      const onlySalonId = businessContexts[0].salonId;
      // First-run: an owner with one un-onboarded salon lands in the import wizard.
      redirect      = ownedNeedingOnboarding.has(onlySalonId) ? '/onboarding/import' : '/admin/calendario';
      activeSalonId = onlySalonId;
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
