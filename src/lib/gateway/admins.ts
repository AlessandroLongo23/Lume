import 'server-only';
import { normalizeProfileRole } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * True when the auth user has platform-wide admin privileges
 * (`profiles.role = 'admin'`).
 */
export async function isAdmin(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  const supabaseAdmin = createAdminClient();
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle<{ role: string | null }>();
  return normalizeProfileRole(data) === 'admin';
}

export function profileIsAdmin(
  profile: { role?: string | null } | null | undefined,
): boolean {
  return normalizeProfileRole(profile) === 'admin';
}
