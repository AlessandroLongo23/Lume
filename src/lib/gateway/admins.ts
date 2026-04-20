import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { normalizeProfileRole } from '@/lib/auth/roles';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * True when the auth user has platform-wide admin privileges
 * (`profiles.role = 'admin'`).
 */
export async function isAdmin(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  const supabaseAdmin = getAdminClient();
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
