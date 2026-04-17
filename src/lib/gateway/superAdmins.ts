import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function isSuperAdmin(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  const supabaseAdmin = getAdminClient();
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('is_super_admin')
    .eq('id', userId)
    .maybeSingle();
  return !!data?.is_super_admin;
}

export function profileIsSuperAdmin(
  profile: { is_super_admin?: boolean | null } | null | undefined,
): boolean {
  return !!profile?.is_super_admin;
}
