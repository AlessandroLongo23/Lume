import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getCallerProfile(supabase: Awaited<ReturnType<typeof createServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const supabaseAdmin = getAdminClient();
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('salon_id, role')
    .eq('id', user.id)
    .single();

  return profile;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || (profile.role !== 'owner' && profile.role !== 'operator')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { client } = await request.json();
    const supabaseAdmin = getAdminClient();

    // Clients are data-only records (no auth user)
    const { data, error: dbError } = await supabaseAdmin
      .from('clients')
      .insert({
        salon_id: profile.salon_id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email || null,
        phonePrefix: client.phonePrefix || null,
        phoneNumber: client.phoneNumber || null,
        gender: client.gender || null,
        isTourist: client.isTourist || false,
        birthDate: client.birthDate || null,
        note: client.note || null,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, client: data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating client:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'Client ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    const { error: dbError } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('salon_id', profile.salon_id);
    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting client:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
