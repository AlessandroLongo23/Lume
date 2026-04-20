import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { canManageSalon } from '@/lib/auth/roles';

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
  let newUserId: string | null = null;

  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || !canManageSalon(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { operator } = await request.json();
    const supabaseAdmin = getAdminClient();

    // 1. Create auth user for the operator
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: operator.email,
      password: operator.password,
      phone: `${operator.phonePrefix}${operator.phoneNumber}`,
      email_confirm: true,
      user_metadata: {
        role: 'operator',
        firstName: operator.firstName,
        lastName: operator.lastName,
        must_change_password: true,
      },
    });

    if (authError) throw authError;
    newUserId = authData.user.id;

    // 2. Insert profile row (links auth user to salon)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUserId,
        salon_id: profile.salon_id,
        first_name: operator.firstName,
        last_name: operator.lastName,
        email: operator.email,
        role: 'operator',
      });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw profileError;
    }

    // 3. Insert operator row with salon_id and user_id
    const { error: dbError } = await supabaseAdmin
      .from('operators')
      .insert({
        salon_id: profile.salon_id,
        user_id: newUserId,
        must_change_password: true,
        firstName: operator.firstName,
        lastName: operator.lastName,
        email: operator.email,
        phonePrefix: operator.phonePrefix,
        phoneNumber: operator.phoneNumber,
      });

    if (dbError) {
      await supabaseAdmin.from('profiles').delete().eq('id', newUserId);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw dbError;
    }

    return NextResponse.json({ success: true, user: authData.user });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating operator:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || !canManageSalon(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id, action } = await request.json();
    if (!id || !['archive', 'restore'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();
    const archived_at = action === 'archive' ? new Date().toISOString() : null;

    const { error: dbError } = await supabaseAdmin
      .from('operators')
      .update({ archived_at })
      .eq('id', id)
      .eq('salon_id', profile.salon_id);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error archiving operator:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || !canManageSalon(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'Operator ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    // Look up the operator's user_id before deleting
    const { data: operatorData } = await supabaseAdmin
      .from('operators')
      .select('user_id')
      .eq('id', id)
      .eq('salon_id', profile.salon_id)
      .single();

    if (!operatorData) {
      return NextResponse.json({ success: false, error: 'Operator not found' }, { status: 404 });
    }

    // Delete operator row
    const { error: dbError } = await supabaseAdmin
      .from('operators')
      .delete()
      .eq('id', id)
      .eq('salon_id', profile.salon_id);
    if (dbError) throw dbError;

    // Delete profile and auth user if linked
    if (operatorData.user_id) {
      await supabaseAdmin.from('profiles').delete().eq('id', operatorData.user_id);
      await supabaseAdmin.auth.admin.deleteUser(operatorData.user_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting operator:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
