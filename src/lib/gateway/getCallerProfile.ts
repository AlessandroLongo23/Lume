import 'server-only';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { createClient as createServerClient } from '@/lib/supabase/server';
import type { ProfileRole } from '@/lib/auth/roles';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export type CallerProfile = {
  id:        string;
  salon_id:  string;
  role:      ProfileRole;
};

/**
 * Resolves the effective profile for the current request.
 *
 * Resolution order mirrors public.get_user_salon_id() so server-side reads
 * agree with what RLS sees:
 *   1. Platform admin? → use lume-active-salon-id cookie (impersonation), role='admin'.
 *   2. Otherwise pick active salon from user_active_salon → primary membership →
 *      earliest membership.
 *   3. The role is read from the membership row at the active salon.
 *
 * Returns null if no salon can be resolved (e.g. admin not yet impersonating,
 * or non-admin without memberships). Callers should 403 in that case.
 */
export async function getCallerProfile(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
): Promise<CallerProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const supabaseAdmin = getAdminClient();
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .maybeSingle<{ is_platform_admin: boolean }>();

  if (profile?.is_platform_admin) {
    const cookieStore = await cookies();
    const activeSalonId = cookieStore.get('lume-active-salon-id')?.value;
    if (!activeSalonId) return null;
    return { id: user.id, salon_id: activeSalonId, role: 'admin' };
  }

  const { data: active } = await supabaseAdmin
    .from('user_active_salon')
    .select('salon_id')
    .eq('user_id', user.id)
    .maybeSingle<{ salon_id: string }>();

  let salonId = active?.salon_id ?? null;

  if (!salonId) {
    const { data: primary } = await supabaseAdmin
      .from('user_salon_memberships')
      .select('salon_id')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .limit(1)
      .maybeSingle<{ salon_id: string }>();
    salonId = primary?.salon_id ?? null;
  }

  if (!salonId) {
    const { data: earliest } = await supabaseAdmin
      .from('user_salon_memberships')
      .select('salon_id')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: true })
      .limit(1)
      .maybeSingle<{ salon_id: string }>();
    salonId = earliest?.salon_id ?? null;
  }

  if (!salonId) return null;

  const { data: membership } = await supabaseAdmin
    .from('user_salon_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('salon_id', salonId)
    .maybeSingle<{ role: 'owner' | 'operator' }>();

  if (!membership) return null;

  return { id: user.id, salon_id: salonId, role: membership.role };
}
