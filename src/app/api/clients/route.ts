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

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id, action } = await request.json();
    if (!id || !['archive', 'restore'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();
    const archived_at = action === 'archive' ? new Date().toISOString() : null;

    // Do not touch auth.users — matches operator behavior. Only archive the clients row.
    const { error: dbError } = await supabaseAdmin
      .from('clients')
      .update({ archived_at })
      .eq('id', id)
      .eq('salon_id', profile.salon_id);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error archiving client:', msg);
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

    // 1. Collect all fiche IDs for this client so we can cascade manually
    const { data: clientFiches, error: fichesLookupError } = await supabaseAdmin
      .from('fiches')
      .select('id')
      .eq('client_id', id)
      .eq('salon_id', profile.salon_id);
    if (fichesLookupError) throw fichesLookupError;

    const ficheIds = (clientFiches ?? []).map((f: { id: string }) => f.id);

    // 2. Delete fiche_services for those fiches (FK → fiches)
    if (ficheIds.length > 0) {
      const { error: ficheServicesError } = await supabaseAdmin
        .from('fiche_services')
        .delete()
        .in('fiche_id', ficheIds);
      if (ficheServicesError) throw ficheServicesError;
    }

    // 3. Delete fiches (FK → clients)
    const { error: fichesError } = await supabaseAdmin
      .from('fiches')
      .delete()
      .eq('client_id', id)
      .eq('salon_id', profile.salon_id);
    if (fichesError) throw fichesError;

    // 5. Delete client row
    const { error: dbError } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('salon_id', profile.salon_id);
    if (dbError) throw dbError;

    // Smart Garbage Collection: only delete the auth.users identity if it is
    // completely orphaned — i.e. no longer referenced anywhere in the system.
    // The same person could be:
    //   • an owner of a salon (salons.owner_id)
    //   • an operator at a salon (operators.user_id)
    //   • a client of a different salon (clients.user_id)
    // Any of these still being present means the identity must be preserved.
    if (clientData.user_id) {
      const userId = clientData.user_id;

      const [
        { count: salonOwnerCount },
        { count: operatorCount },
        { count: otherClientCount },
      ] = await Promise.all([
        supabaseAdmin
          .from('salons')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', userId),
        supabaseAdmin
          .from('operators')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabaseAdmin
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
      ]);

      const totalAssociations =
        (salonOwnerCount ?? 0) + (operatorCount ?? 0) + (otherClientCount ?? 0);

      if (totalAssociations === 0) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
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
