import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { createClient as createServerClient } from '@/lib/supabase/server';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export type CallerProfile = {
  salon_id:     string;
  role:         'owner' | 'operator';
  isSuperAdmin: boolean;
};

/**
 * Resolves the effective profile for the current request.
 *
 * For a super-admin, synthesizes `{ salon_id: <cookie>, role: 'owner' }` from
 * the `lume-active-salon-id` cookie so existing owner-only API code works
 * transparently when impersonating a salon. Returns null if a super-admin has
 * not yet entered any salon — callers should 403 in that case.
 */
export async function getCallerProfile(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
): Promise<CallerProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const supabaseAdmin = getAdminClient();
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('salon_id, role, is_super_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.is_super_admin) {
    const cookieStore = await cookies();
    const activeSalonId = cookieStore.get('lume-active-salon-id')?.value;
    if (!activeSalonId) return null;
    return { salon_id: activeSalonId, role: 'owner', isSuperAdmin: true };
  }

  if (!profile) return null;
  return { salon_id: profile.salon_id, role: profile.role, isSuperAdmin: false };
}
