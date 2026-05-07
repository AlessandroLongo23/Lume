import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';
import { canManageSalon } from '@/lib/auth/roles';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Returns true if the email already belongs to an auth.users identity in the
 * system (denormalized via profiles or clients). The cross-salon collision
 * graceful flow lives in identity sub-problem #03; until that lands, we just
 * surface a clean 409 here.
 */
async function emailAlreadyTaken(
  supabaseAdmin: ReturnType<typeof getAdminClient>,
  email: string,
): Promise<boolean> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (profile?.id) return true;

  const { data: existingClient } = await supabaseAdmin
    .from('clients')
    .select('user_id')
    .eq('email', email)
    .not('user_id', 'is', null)
    .limit(1)
    .maybeSingle();
  return !!existingClient?.user_id;
}

export async function POST(request: NextRequest) {
  let createdAuthUserId: string | null = null;

  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || !canManageSalon(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { operator } = await request.json();

    if (!operator?.firstName?.trim() || !operator?.lastName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nome e cognome sono obbligatori' },
        { status: 400 },
      );
    }

    const email = typeof operator.email === 'string' && operator.email.trim() !== ''
      ? operator.email.trim()
      : null;
    const password = typeof operator.password === 'string' && operator.password.length > 0
      ? operator.password
      : null;
    const phonePrefix = typeof operator.phonePrefix === 'string' && operator.phonePrefix.trim() !== ''
      ? operator.phonePrefix.trim()
      : null;
    const phoneNumber = typeof operator.phoneNumber === 'string' && operator.phoneNumber.trim() !== ''
      ? operator.phoneNumber.trim()
      : null;

    const supabaseAdmin = getAdminClient();
    const wantsAccount = !!email && !!password;

    // Branch 1: no-auth operator. Skip auth.users + profiles entirely.
    // Branch 2/3: account requested. Detect collision (#03) before creating.
    if (wantsAccount) {
      const collision = await emailAlreadyTaken(supabaseAdmin, email!);
      if (collision) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Questa email è già registrata. Per ora utilizza un'email diversa o crea l'operatore senza account.",
          },
          { status: 409 },
        );
      }

      // Branch 3: net new email — create auth user + profile, link operator.
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email!,
        password: password!,
        phone: phonePrefix && phoneNumber ? `${phonePrefix}${phoneNumber}` : undefined,
        email_confirm: true,
        user_metadata: {
          role: 'operator',
          firstName: operator.firstName,
          lastName: operator.lastName,
          must_change_password: true,
        },
      });
      if (authError) throw authError;
      createdAuthUserId = authData.user.id;

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: createdAuthUserId,
          salon_id: profile.salon_id,
          first_name: operator.firstName,
          last_name: operator.lastName,
          email,
          role: 'operator',
        });
      if (profileError) throw profileError;
    }

    const { data: insertedOperator, error: dbError } = await supabaseAdmin
      .from('operators')
      .insert({
        salon_id: profile.salon_id,
        user_id: createdAuthUserId,
        must_change_password: wantsAccount,
        firstName: operator.firstName,
        lastName: operator.lastName,
        email,
        phonePrefix,
        phoneNumber,
      })
      .select()
      .single();

    if (dbError) {
      if (createdAuthUserId) {
        await supabaseAdmin.from('profiles').delete().eq('id', createdAuthUserId);
        await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
      }
      throw dbError;
    }

    return NextResponse.json({ success: true, operator: insertedOperator });
  } catch (error) {
    if (createdAuthUserId) {
      try {
        const supabaseAdmin = getAdminClient();
        await supabaseAdmin.from('profiles').delete().eq('id', createdAuthUserId);
        await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
      } catch { /* best-effort cleanup */ }
    }
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

    const body = await request.json();
    const { id, action } = body;
    if (!id) return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });

    const supabaseAdmin = getAdminClient();

    if (action === 'archive' || action === 'restore') {
      const archived_at = action === 'archive' ? new Date().toISOString() : null;
      const { error: dbError } = await supabaseAdmin
        .from('operators')
        .update({ archived_at })
        .eq('id', id)
        .eq('salon_id', profile.salon_id);
      if (dbError) throw dbError;
      return NextResponse.json({ success: true });
    }

    if (action === 'addCredentials') {
      // Promote a no-auth operator to one that can log in. Mirrors the
      // clients `updateContact` flow but operator-shaped: email + password
      // are mandatory, no phone-only path. Cross-salon collision lands in #03.
      const newEmail = typeof body.email === 'string' && body.email.trim() !== ''
        ? body.email.trim()
        : null;
      const newPassword = typeof body.password === 'string' && body.password.length > 0
        ? body.password
        : null;

      if (!newEmail || !newPassword) {
        return NextResponse.json(
          { success: false, error: 'Email e password sono obbligatori' },
          { status: 400 },
        );
      }

      const { data: existing, error: lookupError } = await supabaseAdmin
        .from('operators')
        .select('id, user_id, email, firstName, lastName')
        .eq('id', id)
        .eq('salon_id', profile.salon_id)
        .single();
      if (lookupError || !existing) {
        return NextResponse.json({ success: false, error: 'Operatore non trovato' }, { status: 404 });
      }

      if (existing.user_id) {
        return NextResponse.json(
          { success: false, error: 'Questo operatore ha già un account' },
          { status: 400 },
        );
      }

      const collision = await emailAlreadyTaken(supabaseAdmin, newEmail);
      if (collision) {
        return NextResponse.json(
          {
            success: false,
            error: "Questa email è già registrata. Utilizza un'email diversa.",
          },
          { status: 409 },
        );
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: newEmail,
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          role: 'operator',
          firstName: existing.firstName,
          lastName: existing.lastName,
          must_change_password: true,
        },
      });
      if (authError) throw authError;
      const newUserId = authData.user.id;

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: newUserId,
          salon_id: profile.salon_id,
          first_name: existing.firstName,
          last_name: existing.lastName,
          email: newEmail,
          role: 'operator',
        });
      if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        throw profileError;
      }

      const { error: dbError } = await supabaseAdmin
        .from('operators')
        .update({
          user_id: newUserId,
          email: newEmail,
          must_change_password: true,
        })
        .eq('id', id)
        .eq('salon_id', profile.salon_id);
      if (dbError) {
        await supabaseAdmin.from('profiles').delete().eq('id', newUserId);
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        throw dbError;
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error patching operator:', msg);
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

    const { data: operatorData } = await supabaseAdmin
      .from('operators')
      .select('user_id')
      .eq('id', id)
      .eq('salon_id', profile.salon_id)
      .single();

    if (!operatorData) {
      return NextResponse.json({ success: false, error: 'Operator not found' }, { status: 404 });
    }

    const { error: dbError } = await supabaseAdmin
      .from('operators')
      .delete()
      .eq('id', id)
      .eq('salon_id', profile.salon_id);
    if (dbError) throw dbError;

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
