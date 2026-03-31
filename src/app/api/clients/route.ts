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

    const { client } = await request.json();
    const supabaseAdmin = getAdminClient();

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: client.email,
      password: client.password,
      phone: `${client.phonePrefix}${client.phoneNumber}`,
      email_confirm: true,
      user_metadata: { role: 'client' },
    });

    if (authError) throw authError;

    const { error: dbError } = await supabaseAdmin
      .from('clients')
      .insert({
        id: authData.user.id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phonePrefix: client.phonePrefix,
        phoneNumber: client.phoneNumber,
        gender: client.gender,
        isTourist: client.isTourist,
        birthDate: client.birthDate || null,
        note: client.note,
      });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, user: authData.user });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error creating client:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'Client ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    const { error: dbError } = await supabaseAdmin.from('clients').delete().eq('id', id);
    if (dbError) throw dbError;

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) {
      return NextResponse.json({ success: false, error: authError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error deleting client:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
