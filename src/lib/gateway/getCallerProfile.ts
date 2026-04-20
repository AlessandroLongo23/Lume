import 'server-only';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { createClient as createServerClient } from '@/lib/supabase/server';
import { normalizeProfileRole, type ProfileRole } from '@/lib/auth/roles';

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
 * For an admin (platform-wide super-admin), synthesizes
 * `{ salon_id: <cookie>, role: 'admin' }` from the `lume-active-salon-id`
 * cookie so existing salon-staff API code works transparently when
 * impersonating. Returns null if an admin has not yet entered any salon —
 * callers should 403 in that case.
 */
export async function getCallerProfile(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
): Promise<CallerProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const supabaseAdmin = getAdminClient();
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('salon_id, role')
    .eq('id', user.id)
    .maybeSingle();

  const role = normalizeProfileRole(profile);
  if (!role) return null;

  if (role === 'admin') {
    const cookieStore = await cookies();
    const activeSalonId = cookieStore.get('lume-active-salon-id')?.value;
    if (!activeSalonId) return null;
    return { id: user.id, salon_id: activeSalonId, role: 'admin' };
  }

  return { id: user.id, salon_id: profile!.salon_id, role };
}
