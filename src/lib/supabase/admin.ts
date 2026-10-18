import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client. Bypasses RLS, so use it only for writes the
 * caller's own client cannot make (impersonation, auth user management,
 * cross-tenant reads, orphan cleanup) and after checking the caller's role.
 *
 * Returns a fresh client on every call: a shared instance would carry over
 * any session set on it to unrelated requests.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export type AdminClient = ReturnType<typeof createAdminClient>;
