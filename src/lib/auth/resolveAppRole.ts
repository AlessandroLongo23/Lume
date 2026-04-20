import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeProfileRole, type AppRole } from '@/lib/auth/roles';

/**
 * Single entry point for "what role is this auth user?" across all four
 * conceptual roles (admin | owner | operator | client). Returns null for
 * orphaned auth users (logged in but neither a salon staff member nor a
 * linked client).
 */
export async function resolveAppRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<AppRole | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle<{ role: string | null }>();

  const profileRole = normalizeProfileRole(profile);
  if (profileRole) return profileRole;

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (client) return 'client';
  return null;
}
