import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';
import { canManageSalon } from '@/lib/auth/roles';
import { sendMembershipInviteEmail } from '@/lib/email/membershipInvite';
import { randomBytes } from 'crypto';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || !canManageSalon(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { operatorId } = await request.json();
    if (!operatorId) {
      return NextResponse.json({ success: false, error: 'operatorId mancante' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    const { data: operator, error: opError } = await supabaseAdmin
      .from('operators')
      .select('id, email, firstName, lastName, user_id')
      .eq('id', operatorId)
      .eq('salon_id', profile.salon_id)
      .single();

    if (opError || !operator) {
      return NextResponse.json({ success: false, error: 'Operatore non trovato' }, { status: 404 });
    }

    if (!operator.email) {
      return NextResponse.json(
        { success: false, error: "L'operatore non ha un'email" },
        { status: 400 },
      );
    }

    if (operator.user_id) {
      const { data: existing } = await supabaseAdmin
        .from('user_salon_memberships')
        .select('id')
        .eq('user_id', operator.user_id)
        .eq('salon_id', profile.salon_id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { success: false, error: "L'operatore è già membro di questo salone" },
          { status: 400 },
        );
      }
    }

    await supabaseAdmin
      .from('pending_membership_invites')
      .update({ declined_at: new Date().toISOString() })
      .eq('salon_id', profile.salon_id)
      .eq('email', operator.email.toLowerCase())
      .is('claimed_at', null)
      .is('declined_at', null);

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from('pending_membership_invites')
      .select('id', { count: 'exact', head: true })
      .eq('salon_id', profile.salon_id)
      .gte('created_at', since);

    if ((count ?? 0) >= 10) {
      return NextResponse.json(
        { success: false, error: "Troppe invitazioni in un'ora. Riprova più tardi." },
        { status: 429 },
      );
    }

    const token = randomBytes(32).toString('base64url');

    const { error: insertError } = await supabaseAdmin
      .from('pending_membership_invites')
      .insert({
        token,
        salon_id:    profile.salon_id,
        email:       operator.email.toLowerCase(),
        target_role: 'operator',
        invited_by:  profile.id,
      });

    if (insertError) throw insertError;

    const [salonResult, ownerResult] = await Promise.all([
      supabaseAdmin.from('salons').select('name').eq('id', profile.salon_id).single(),
      supabaseAdmin.from('profiles').select('first_name, last_name').eq('id', profile.id).single(),
    ]);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.lumeapp.it';
    const ownerName = ownerResult.data
      ? `${ownerResult.data.first_name ?? ''} ${ownerResult.data.last_name ?? ''}`.trim()
      : 'Il titolare del salone';

    await sendMembershipInviteEmail({
      toEmail:     operator.email,
      toFirstName: operator.firstName ?? 'Operatore',
      ownerName,
      salonName:   salonResult.data?.name ?? 'il salone',
      token,
      baseUrl,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error reinviting operator:', msg);
    return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || !canManageSalon(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { inviteId } = await request.json();
    if (!inviteId) {
      return NextResponse.json({ success: false, error: 'inviteId mancante' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    const { data: invite } = await supabaseAdmin
      .from('pending_membership_invites')
      .select('id, salon_id')
      .eq('id', inviteId)
      .eq('salon_id', profile.salon_id)
      .is('claimed_at', null)
      .maybeSingle();

    if (!invite) {
      return NextResponse.json({ success: false, error: 'Invito non trovato' }, { status: 404 });
    }

    await supabaseAdmin.from('pending_membership_invites').delete().eq('id', inviteId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error revoking invite:', msg);
    return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500 });
  }
}
