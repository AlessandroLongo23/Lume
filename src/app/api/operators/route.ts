import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';
import { logActivity } from '@/lib/gateway/logActivity';
import { canManageSalon } from '@/lib/auth/roles';
import { randomBytes } from 'crypto';
import { sendMembershipInviteEmail } from '@/lib/email/membershipInvite';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type ExistingUserLookup = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
} | null;

async function findExistingUser(
  supabaseAdmin: ReturnType<typeof getAdminClient>,
  email: string,
): Promise<ExistingUserLookup> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('email', email.toLowerCase())
    .maybeSingle<{ id: string; first_name: string | null; last_name: string | null }>();

  if (profile?.id) {
    return { userId: profile.id, firstName: profile.first_name, lastName: profile.last_name };
  }

  const { data: existingClient } = await supabaseAdmin
    .from('clients')
    .select('user_id')
    .eq('email', email.toLowerCase())
    .not('user_id', 'is', null)
    .limit(1)
    .maybeSingle<{ user_id: string }>();

  if (existingClient?.user_id) {
    return { userId: existingClient.user_id, firstName: null, lastName: null };
  }

  return null;
}

const NEUTRAL_INVITE_RESPONSE =
  "Se l'email è già registrata su Lume, l'operatore riceverà un invito a unirsi al tuo salone. Altrimenti, l'account è stato creato con la password indicata.";

async function issueInvite(
  supabaseAdmin: ReturnType<typeof getAdminClient>,
  params: {
    salonId: string;
    email: string;
    invitedBy: string;
    inviteeFirstName: string;
  },
): Promise<void> {
  await supabaseAdmin
    .from('pending_membership_invites')
    .update({ declined_at: new Date().toISOString() })
    .eq('salon_id', params.salonId)
    .eq('email', params.email.toLowerCase())
    .is('claimed_at', null)
    .is('declined_at', null);

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from('pending_membership_invites')
    .select('id', { count: 'exact', head: true })
    .eq('salon_id', params.salonId)
    .gte('created_at', since);

  if ((count ?? 0) >= 10) {
    throw Object.assign(new Error('rate_limited'), { status: 429 });
  }

  const token = randomBytes(32).toString('base64url');

  const { error: inviteError } = await supabaseAdmin
    .from('pending_membership_invites')
    .insert({
      token,
      salon_id:    params.salonId,
      email:       params.email.toLowerCase(),
      target_role: 'operator',
      invited_by:  params.invitedBy,
    });

  if (inviteError) throw inviteError;

  const [salonData, ownerData] = await Promise.all([
    supabaseAdmin.from('salons').select('name').eq('id', params.salonId).single(),
    supabaseAdmin.from('profiles').select('first_name, last_name').eq('id', params.invitedBy).single(),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.lumeapp.it';
  const ownerName = ownerData.data
    ? `${ownerData.data.first_name ?? ''} ${ownerData.data.last_name ?? ''}`.trim()
    : 'Il titolare del salone';

  await sendMembershipInviteEmail({
    toEmail:     params.email,
    toFirstName: params.inviteeFirstName,
    ownerName,
    salonName:   salonData.data?.name ?? 'il salone',
    token,
    baseUrl,
  });
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
      const existingUser = await findExistingUser(supabaseAdmin, email!);
      if (existingUser) {
        // Idempotency: if an operator row already exists for this user at this salon, reuse it.
        const { data: existingOp } = await supabaseAdmin
          .from('operators')
          .select('*')
          .eq('user_id', existingUser.userId)
          .eq('salon_id', profile.salon_id)
          .maybeSingle();

        let operatorRow: Record<string, unknown>;
        if (existingOp) {
          operatorRow = existingOp as Record<string, unknown>;
        } else {
          const { data: insertedOp, error: opError } = await supabaseAdmin
            .from('operators')
            .insert({
              salon_id:            profile.salon_id,
              user_id:             existingUser.userId,
              must_change_password: false,
              firstName:           operator.firstName,
              lastName:            operator.lastName,
              email:               email!.toLowerCase(),
              phonePrefix,
              phoneNumber,
            })
            .select()
            .single();
          if (opError) throw opError;
          operatorRow = insertedOp as Record<string, unknown>;
        }

        try {
          await issueInvite(supabaseAdmin, {
            salonId:          profile.salon_id,
            email:            email!,
            invitedBy:        profile.id,
            inviteeFirstName: existingUser.firstName ?? operator.firstName ?? 'Operatore',
          });
        } catch (err: unknown) {
          if (err instanceof Error && 'status' in err && (err as { status: number }).status === 429) {
            return NextResponse.json(
              { success: false, error: "Troppe invitazioni in un'ora. Riprova più tardi." },
              { status: 429 },
            );
          }
          console.error('issueInvite failed in POST (invite row may still exist):', err);
        }

        await logActivity({
          salonId: profile.salon_id,
          actorId: profile.id,
          entityType: 'operators',
          entityId: String(operatorRow.id),
          action: 'create',
          changes: operatorRow,
          summary: `ha invitato l'operatore ${operator.firstName} ${operator.lastName}`.trim(),
        });
        return NextResponse.json({ success: true, operator: operatorRow, invited: true, message: NEUTRAL_INVITE_RESPONSE });
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

      // Membership: this operator can act as an operator at this salon.
      // is_primary=false because operators added by an owner shouldn't take over
      // the user's primary-salon flag (the user might be an owner elsewhere).
      const { error: membershipError } = await supabaseAdmin
        .from('user_salon_memberships')
        .insert({
          user_id:    createdAuthUserId,
          salon_id:   profile.salon_id,
          role:       'operator',
          is_primary: false,
        });
      if (membershipError) throw membershipError;
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
        await supabaseAdmin.from('user_salon_memberships').delete().eq('user_id', createdAuthUserId);
        await supabaseAdmin.from('profiles').delete().eq('id', createdAuthUserId);
        await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
      }
      throw dbError;
    }

    await logActivity({
      salonId: profile.salon_id,
      actorId: profile.id,
      entityType: 'operators',
      entityId: insertedOperator.id,
      action: 'create',
      changes: insertedOperator,
    });

    return NextResponse.json({ success: true, operator: insertedOperator });
  } catch (error) {
    if (createdAuthUserId) {
      try {
        const supabaseAdmin = getAdminClient();
        await supabaseAdmin.from('user_salon_memberships').delete().eq('user_id', createdAuthUserId);
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
      await logActivity({
        salonId: profile.salon_id,
        actorId: profile.id,
        entityType: 'operators',
        entityId: id,
        action: 'update',
        summary: action === 'archive' ? "ha archiviato l'operatore" : "ha ripristinato l'operatore",
      });
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

      const existingUser = await findExistingUser(supabaseAdmin, newEmail);
      if (existingUser) {
        const { error: updateError } = await supabaseAdmin
          .from('operators')
          .update({ user_id: existingUser.userId, email: newEmail.toLowerCase() })
          .eq('id', id)
          .eq('salon_id', profile.salon_id);
        if (updateError) throw updateError;

        try {
          await issueInvite(supabaseAdmin, {
            salonId:          profile.salon_id,
            email:            newEmail,
            invitedBy:        profile.id,
            inviteeFirstName: existingUser.firstName ?? existing.firstName ?? 'Operatore',
          });
        } catch (err: unknown) {
          if (err instanceof Error && 'status' in err && (err as { status: number }).status === 429) {
            return NextResponse.json(
              { success: false, error: "Troppe invitazioni in un'ora. Riprova più tardi." },
              { status: 429 },
            );
          }
          console.error('issueInvite failed in addCredentials (invite row may still exist):', err);
        }

        await logActivity({
          salonId: profile.salon_id,
          actorId: profile.id,
          entityType: 'operators',
          entityId: id,
          action: 'update',
          summary: "ha aggiunto le credenziali a un operatore",
        });
        return NextResponse.json({ success: true, invited: true, message: NEUTRAL_INVITE_RESPONSE });
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

      // Same membership write as the POST/auth path.
      const { error: membershipError } = await supabaseAdmin
        .from('user_salon_memberships')
        .insert({
          user_id:    newUserId,
          salon_id:   profile.salon_id,
          role:       'operator',
          is_primary: false,
        });
      if (membershipError) {
        await supabaseAdmin.from('profiles').delete().eq('id', newUserId);
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        throw membershipError;
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
        await supabaseAdmin.from('user_salon_memberships').delete().eq('user_id', newUserId);
        await supabaseAdmin.from('profiles').delete().eq('id', newUserId);
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        throw dbError;
      }

      await logActivity({
        salonId: profile.salon_id,
        actorId: profile.id,
        entityType: 'operators',
        entityId: id,
        action: 'update',
        summary: "ha aggiunto le credenziali a un operatore",
      });

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
      .select('user_id, firstName, lastName')
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
      // Drop the membership for this salon. This is unconditional — even if
      // there's no row (e.g. legacy operator created before memberships
      // existed), the delete is a no-op.
      await supabaseAdmin
        .from('user_salon_memberships')
        .delete()
        .eq('user_id', operatorData.user_id)
        .eq('salon_id', profile.salon_id);

      // Only delete the auth identity if this user has no remaining
      // attachments to ANY salon. With multi-salon memberships, the user might
      // be an owner or operator elsewhere — preserve their account.
      const [otherMemberships, clientLinks] = await Promise.all([
        supabaseAdmin
          .from('user_salon_memberships')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', operatorData.user_id),
        supabaseAdmin
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', operatorData.user_id),
      ]);

      const hasOtherMemberships = (otherMemberships.count ?? 0) > 0;
      const hasClientLinks      = (clientLinks.count ?? 0) > 0;

      if (!hasOtherMemberships && !hasClientLinks) {
        await supabaseAdmin.from('user_active_salon').delete().eq('user_id', operatorData.user_id);
        await supabaseAdmin.from('profiles').delete().eq('id', operatorData.user_id);
        await supabaseAdmin.auth.admin.deleteUser(operatorData.user_id);
      } else {
        // Keep the auth user but make sure their active salon isn't this
        // (now-removed) one.
        await supabaseAdmin
          .from('user_active_salon')
          .delete()
          .eq('user_id', operatorData.user_id)
          .eq('salon_id', profile.salon_id);
      }
    }

    {
      const name = [operatorData.firstName, operatorData.lastName].filter(Boolean).join(' ').trim();
      await logActivity({
        salonId: profile.salon_id,
        actorId: profile.id,
        entityType: 'operators',
        entityId: id,
        action: 'delete',
        summary: name ? `ha eliminato l'operatore ${name}` : "ha eliminato un operatore",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting operator:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
