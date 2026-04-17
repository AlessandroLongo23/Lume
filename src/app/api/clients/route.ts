import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { toE164 } from '@/lib/utils/phone';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Looks up an existing auth.users identity by email OR phone without creating
 * a new one. Checks the profiles table (owners/operators, email only — phone
 * is not denormalized there) and the clients table (any salon) for either
 * identifier. Returns the user_id if found, null otherwise.
 */
async function findExistingUserId(
  supabaseAdmin: ReturnType<typeof getAdminClient>,
  params: { email: string | null; phonePrefix: string | null; phoneNumber: string | null },
): Promise<string | null> {
  const { email, phonePrefix, phoneNumber } = params;

  if (email) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (profile?.id) return profile.id;

    const { data: existingClient } = await supabaseAdmin
      .from('clients')
      .select('user_id')
      .eq('email', email)
      .not('user_id', 'is', null)
      .limit(1)
      .maybeSingle();
    if (existingClient?.user_id) return existingClient.user_id;
  }

  if (phonePrefix && phoneNumber) {
    const { data: existingClient } = await supabaseAdmin
      .from('clients')
      .select('user_id')
      .eq('phonePrefix', phonePrefix)
      .eq('phoneNumber', phoneNumber)
      .not('user_id', 'is', null)
      .limit(1)
      .maybeSingle();
    if (existingClient?.user_id) return existingClient.user_id;
  }

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

    const email = typeof client.email === 'string' && client.email.trim() !== ''
      ? client.email.trim()
      : null;
    const phonePrefix = typeof client.phonePrefix === 'string' && client.phonePrefix.trim() !== ''
      ? client.phonePrefix.trim()
      : null;
    const phoneNumber = typeof client.phoneNumber === 'string' && client.phoneNumber.trim() !== ''
      ? client.phoneNumber.trim()
      : null;

    if (!email && !(phonePrefix && phoneNumber)) {
      return NextResponse.json(
        { success: false, error: 'Inserisci almeno un\'email o un numero di telefono' },
        { status: 400 },
      );
    }

    const supabaseAdmin = getAdminClient();

    // 1. Resolve the auth identity: reuse an existing user or create a new one.
    //    A person can be an owner of another salon, or a client of another salon —
    //    in both cases they already have an auth.users row we must not duplicate.
    let userId = await findExistingUserId(supabaseAdmin, { email, phonePrefix, phoneNumber });

    if (!userId) {
      // Supabase Auth requires email OR phone on createUser. We pass whichever
      // the operator provided (or both). The auto-generated password is shared
      // across both channels so the client can log in with either.
      const phoneE164 = toE164(phonePrefix, phoneNumber);
      const createPayload: Parameters<typeof supabaseAdmin.auth.admin.createUser>[0] = {
        password: client.password,
        user_metadata: {
          role: 'client',
          firstName: client.firstName,
          lastName: client.lastName,
        },
      };
      if (email) {
        createPayload.email = email;
        createPayload.email_confirm = true;
      }
      if (phoneE164) {
        createPayload.phone = phoneE164;
        createPayload.phone_confirm = true;
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser(createPayload);
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
        email,
        phonePrefix,
        phoneNumber,
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

    if (!profile || (profile.role !== 'owner' && profile.role !== 'operator')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, action } = body;
    if (!id) return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });

    const supabaseAdmin = getAdminClient();

    if (action === 'archive' || action === 'restore') {
      if (profile.role !== 'owner') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
      }
      const archived_at = action === 'archive' ? new Date().toISOString() : null;

      const { error: dbError } = await supabaseAdmin
        .from('clients')
        .update({ archived_at })
        .eq('id', id)
        .eq('salon_id', profile.salon_id);

      if (dbError) throw dbError;
      return NextResponse.json({ success: true });
    }

    if (action === 'updateContact') {
      // Add the missing identifier (email OR phone) to an existing client.
      // Cannot clear or overwrite an identifier that is already set — this
      // keeps the auth.users identity stable.
      const newEmail = typeof body.email === 'string' && body.email.trim() !== ''
        ? body.email.trim()
        : null;
      const newPrefix = typeof body.phonePrefix === 'string' && body.phonePrefix.trim() !== ''
        ? body.phonePrefix.trim()
        : null;
      const newNumber = typeof body.phoneNumber === 'string' && body.phoneNumber.trim() !== ''
        ? body.phoneNumber.trim()
        : null;

      const { data: existing, error: lookupError } = await supabaseAdmin
        .from('clients')
        .select('id, user_id, email, phonePrefix, phoneNumber')
        .eq('id', id)
        .eq('salon_id', profile.salon_id)
        .single();
      if (lookupError || !existing) {
        return NextResponse.json({ success: false, error: 'Cliente non trovato' }, { status: 404 });
      }

      // Enforce "add-only" semantics
      if (existing.email && newEmail !== existing.email) {
        return NextResponse.json(
          { success: false, error: 'Non è possibile modificare o rimuovere l\'email esistente' },
          { status: 400 },
        );
      }
      const hasExistingPhone = !!(existing.phonePrefix && existing.phoneNumber);
      if (hasExistingPhone && (newPrefix !== existing.phonePrefix || newNumber !== existing.phoneNumber)) {
        return NextResponse.json(
          { success: false, error: 'Non è possibile modificare o rimuovere il telefono esistente' },
          { status: 400 },
        );
      }

      const addingEmail = !existing.email && !!newEmail;
      const addingPhone = !hasExistingPhone && !!(newPrefix && newNumber);

      if (!addingEmail && !addingPhone) {
        return NextResponse.json({ success: true }); // no-op
      }

      // Update auth.users first (fails loudly if the identifier is already in use)
      if (existing.user_id) {
        const authUpdate: { email?: string; phone?: string } = {};
        if (addingEmail) authUpdate.email = newEmail!;
        if (addingPhone) {
          const phoneE164 = toE164(newPrefix, newNumber);
          if (phoneE164) authUpdate.phone = phoneE164;
        }
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          existing.user_id,
          authUpdate,
        );
        if (authError) throw authError;
      }

      // Then update denormalized columns on clients
      const clientUpdate: { email?: string; phonePrefix?: string; phoneNumber?: string } = {};
      if (addingEmail) clientUpdate.email = newEmail!;
      if (addingPhone) {
        clientUpdate.phonePrefix = newPrefix!;
        clientUpdate.phoneNumber = newNumber!;
      }
      const { error: dbError } = await supabaseAdmin
        .from('clients')
        .update(clientUpdate)
        .eq('id', id)
        .eq('salon_id', profile.salon_id);
      if (dbError) throw dbError;

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error patching client:', msg);
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
