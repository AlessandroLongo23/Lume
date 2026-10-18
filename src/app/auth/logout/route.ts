import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST() {
  const supabase = await createClient();

  // Grab the user id BEFORE signing out — after signOut() the session is gone.
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.auth.signOut();

  // Clear any lingering super-admin impersonation row so the next login
  // starts clean (no auto-resume of a prior impersonation session).
  if (user) {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
      .from('super_admin_impersonation')
      .delete()
      .eq('user_id', user.id);
    if (error) console.error('logout impersonation cleanup error:', error);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete('lume-active-salon-id');
  response.cookies.delete('lume-impersonating');
  return response;
}
