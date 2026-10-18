import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/gateway/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST() {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  // Delete the RLS truth row first. Even if this fails we still clear the
  // cookies so the UI doesn't lie — next request will see an orphan and
  // resolveWorkspace will clean up.
  const supabaseAdmin = createAdminClient();
  const { error: deleteError } = await supabaseAdmin
    .from('super_admin_impersonation')
    .delete()
    .eq('user_id', guard.user.id);

  if (deleteError) {
    console.error('exit-impersonation delete error:', deleteError);
  }

  const cookieStore = await cookies();
  cookieStore.delete('lume-active-salon-id');
  cookieStore.delete('lume-impersonating');

  return NextResponse.json({ redirect: '/platform/dashboard' });
}
