import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    // 1. Clear must_change_password from auth user_metadata
    const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, must_change_password: false },
    });
    if (metaError) throw metaError;

    // 2. Clear must_change_password on the operators row
    const { error: dbError } = await supabaseAdmin
      .from('operators')
      .update({ must_change_password: false })
      .eq('user_id', user.id);
    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error clearing must_change_password:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
