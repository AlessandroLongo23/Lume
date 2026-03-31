import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.user_metadata?.role !== 'operator') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { operator } = await request.json();
    const supabaseAdmin = getAdminClient();

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: operator.email,
      password: operator.password,
      phone: `${operator.phonePrefix}${operator.phoneNumber}`,
      email_confirm: true,
      user_metadata: { role: 'operator' },
    });

    if (authError) throw authError;

    const { error: dbError } = await supabaseAdmin
      .from('operators')
      .insert({
        id: authData.user.id,
        firstName: operator.firstName,
        lastName: operator.lastName,
        email: operator.email,
        phonePrefix: operator.phonePrefix,
        phoneNumber: operator.phoneNumber,
      });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, user: authData.user });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating operator:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    if (session.user.user_metadata?.role !== 'operator') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'Operator ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    const { error: dbError } = await supabaseAdmin.from('operators').delete().eq('id', id);
    if (dbError) throw dbError;

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) {
      return NextResponse.json({ success: false, error: authError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting operator:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
