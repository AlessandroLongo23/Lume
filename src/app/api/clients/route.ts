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

/**
 * Looks up an existing auth.users identity by email without creating a new one.
 * Checks the profiles table (owners/operators) and the clients table (existing
 * clients of any salon). Returns the user_id if found, null otherwise.
 */
async function findExistingUserId(
  supabaseAdmin: ReturnType<typeof getAdminClient>,
  email: string,
): Promise<string | null> {
  // Owners and operators have a profiles row
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (profile?.id) return profile.id;

  // Clients added by any salon have a clients row with a user_id
  const { data: existingClient } = await supabaseAdmin
    .from('clients')
    .select('user_id')
    .eq('email', email)
    .not('user_id', 'is', null)
    .limit(1)
    .maybeSingle();
  if (existingClient?.user_id) return existingClient.user_id;

  return null;
}

export async function POST(request: NextRequest) {
  // Track whether we created the auth user so we only roll back what we own
  let createdAuthUserId: string | null = null;

  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || (profile.role !== 'owner' && profile.role !== 'operator')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { client } = await request.json();
    const supabaseAdmin = getAdminClient();

    // 1. Resolve the auth identity: reuse an existing user or create a new one.
    //    A person can be an owner of another salon, or a client of another salon —
    //    in both cases they already have an auth.users row we must not duplicate.
    let userId = await findExistingUserId(supabaseAdmin, client.email);

    if (!userId) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: client.email,
        password: client.password,
        email_confirm: true,
        user_metadata: {
          role: 'client',
          firstName: client.firstName,
          lastName: client.lastName,
        },
      });
      if (authError) throw authError;
      userId = authData.user.id;
      createdAuthUserId = userId; // remember we own this — roll back on failure
    }

    // 2. Insert client row linking this salon to the (existing or new) identity
    const { data, error: dbError } = await supabaseAdmin
      .from('clients')
      .insert({
        salon_id: profile.salon_id,
        user_id: userId,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phonePrefix: client.phonePrefix ?? null,
        phoneNumber: client.phoneNumber ?? null,
        gender: client.gender ?? null,
        isTourist: client.isTourist ?? false,
        birthDate: client.birthDate ?? null,
        categoryId: client.categoryId || null,
        note: client.note ?? null,
      })
      .select()
      .single();

    if (dbError) {
      // Only delete the auth user if we created it in this request
      if (createdAuthUserId) {
        await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
      }
      throw dbError;
    }

    return NextResponse.json({ success: true, client: data });
  } catch (error) {
    if (createdAuthUserId) {
      try {
        const supabaseAdmin = getAdminClient();
        await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
      } catch { /* best-effort cleanup */ }
    }
    const msg = error instanceof Error
      ? error.message
      : (error && typeof error === 'object' && 'message' in error)
        ? String(error.message)
        : 'Unknown error';
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

    // Look up the client's user_id before deleting
    const { data: clientData } = await supabaseAdmin
      .from('clients')
      .select('user_id')
      .eq('id', id)
      .eq('salon_id', profile.salon_id)
      .single();

    if (!clientData) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    // Delete client row
    const { error: dbError } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('salon_id', profile.salon_id);
    if (dbError) throw dbError;

    // Only delete the auth user if this was their sole identity association.
    // The same person may be a client of another salon or an owner/operator
    // elsewhere — deleting their auth account would lock them out of everything.
    if (clientData.user_id) {
      const [{ count: otherClientCount }, { data: ownerProfile }] = await Promise.all([
        supabaseAdmin
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', clientData.user_id),
        supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', clientData.user_id)
          .maybeSingle(),
      ]);

      const isLastAssociation = (otherClientCount ?? 0) === 0 && !ownerProfile;
      if (isLastAssociation) {
        await supabaseAdmin.auth.admin.deleteUser(clientData.user_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error
      ? error.message
      : (error && typeof error === 'object' && 'message' in error)
        ? String(error.message)
        : 'Unknown error';
    console.error('Error deleting client:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
