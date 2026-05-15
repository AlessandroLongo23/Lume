import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { BusinessType, OriginType } from '@/lib/types/Salon';
import { LEGAL_VERSIONS } from '@/lib/const/legalVersions';

function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

const VALID_BUSINESS_TYPES: BusinessType[] = ['barber', 'hair_salon', 'beauty_center', 'nails', 'other'];
const VALID_ORIGINS: OriginType[] = ['word_of_mouth', 'social_media', 'google', 'event'];

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  let userId: string | null = null;
  let salonId: string | null = null;
  let createdAuthUser = false; // true only when we own the auth.users row

  try {
    const body = await request.json();
    const {
      email, password, firstName, lastName, salonName, businessType, origin, inviteCode,
      acceptedTerms, acceptedVessatorie, acceptedDpa,
    } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !salonName || !businessType || !origin) {
      return NextResponse.json({ success: false, error: 'Tutti i campi obbligatori devono essere compilati.' }, { status: 400 });
    }
    if (!acceptedTerms || !acceptedVessatorie || !acceptedDpa) {
      return NextResponse.json({
        success: false,
        error: 'Per completare la registrazione devi accettare i Termini, le clausole vessatorie e il Data Processing Agreement.',
      }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, error: 'La password deve contenere almeno 8 caratteri.' }, { status: 400 });
    }
    if (!VALID_BUSINESS_TYPES.includes(businessType)) {
      return NextResponse.json({ success: false, error: 'Tipo di attività non valido.' }, { status: 400 });
    }
    if (!VALID_ORIGINS.includes(origin)) {
      return NextResponse.json({ success: false, error: 'Origine non valida.' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    // 1. Resolve auth identity — create new or reuse existing.
    //    A person may already have an account (client of another salon, or
    //    owner of another business). We must not duplicate auth.users.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'owner', firstName, lastName },
    });

    if (authError) {
      const isDuplicate = authError.message.toLowerCase().includes('already') || authError.message.toLowerCase().includes('exists');
      if (!isDuplicate) {
        console.error('Auth user creation failed:', authError);
        return NextResponse.json({ success: false, error: 'Impossibile creare l\'account. Riprova.' }, { status: 500 });
      }

      // Email already exists — verify the password by attempting a real sign-in.
      // signInWithPassword returns the user object on success, giving us the ID
      // without needing to scan the full paginated listUsers response.
      const anonClient = getAnonClient();
      const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({ email, password });
      if (signInError || !signInData.user) {
        return NextResponse.json(
          {
            success: false,
            code: 'EMAIL_EXISTS_WRONG_PASSWORD',
            error: 'Esiste già un account con questa email, ma la password non è corretta. Usa la stessa password del tuo account esistente.',
          },
          { status: 409 },
        );
      }
      userId = signInData.user.id;
      // Sign out the temporary session created by the verification check
      await anonClient.auth.signOut();
      // We are reusing an existing identity — do NOT delete it on rollback
    } else {
      userId = authData.user.id;
      createdAuthUser = true;
    }

    // 2. Insert salon
    const { data: salonData, error: salonError } = await supabaseAdmin
      .from('salons')
      .insert({
        name:        salonName,
        type:        businessType,
        origin,
        invite_code: inviteCode || null,
        owner_id:    userId,
      })
      .select('id')
      .single();

    if (salonError) {
      console.error('Salon insert failed:', salonError);
      if (createdAuthUser) await rollbackUser(supabaseAdmin, userId);
      return NextResponse.json({ success: false, error: 'Errore durante la creazione del salone. Riprova.' }, { status: 500 });
    }

    salonId = salonData.id;

    // 2b. Handle referral code
    if (inviteCode) {
      const { data: referrerSalon } = await supabaseAdmin
        .from('salons')
        .select('id')
        .eq('referral_code', inviteCode.toUpperCase().trim())
        .single();

      if (referrerSalon) {
        // Extend trial to 45 days and link referral
        await supabaseAdmin
          .from('salons')
          .update({
            referred_by_salon_id: referrerSalon.id,
            trial_ends_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', salonId);

        // Create pending referral credit (referrer always gets the row,
        // cap is checked only when applying the monetary credit)
        await supabaseAdmin
          .from('referral_credits')
          .insert({
            referrer_salon_id: referrerSalon.id,
            referred_salon_id: salonId,
            status: 'pending',
          });
      }
    }

    // 3. Ensure profile exists. The auth user might already have one (platform
    //    admin registering their own salon, owner adding a second salon, or a
    //    client of another salon upgrading). In those cases we keep the existing
    //    profile untouched — salon ownership is recorded in user_salon_memberships
    //    below, and getCallerProfile resolves role/active salon from there.
    let createdProfile = false;
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!existingProfile) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id:         userId,
          salon_id:   salonId,
          first_name: firstName,
          last_name:  lastName,
          email,
          role:       'owner',
        });

      if (profileError) {
        console.error('Profile insert failed:', profileError);
        await rollbackSalon(supabaseAdmin, salonId!);
        if (createdAuthUser) await rollbackUser(supabaseAdmin, userId);
        return NextResponse.json({ success: false, error: 'Errore durante la creazione del profilo. Riprova.' }, { status: 500 });
      }
      createdProfile = true;
    }

    // 3b. Insert membership (canonical "this user is owner of this salon").
    //     profiles.role and profiles.salon_id stay populated until PR C drops them.
    //     is_primary=true because this is the user's first/only salon today; if
    //     they already have other memberships (rare during transition), the
    //     unique partial index will prevent dual primaries — handle by clearing
    //     the existing primary first.
    const { data: existingPrimary } = await supabaseAdmin
      .from('user_salon_memberships')
      .select('id')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .maybeSingle();

    if (existingPrimary) {
      await supabaseAdmin
        .from('user_salon_memberships')
        .update({ is_primary: false })
        .eq('id', existingPrimary.id);
    }

    const { error: membershipError } = await supabaseAdmin
      .from('user_salon_memberships')
      .insert({
        user_id:    userId,
        salon_id:   salonId,
        role:       'owner',
        is_primary: true,
      });

    if (membershipError) {
      console.error('Membership insert failed:', membershipError);
      if (createdProfile) await rollbackProfile(supabaseAdmin, userId);
      await rollbackSalon(supabaseAdmin, salonId!);
      if (createdAuthUser) await rollbackUser(supabaseAdmin, userId);
      return NextResponse.json({ success: false, error: 'Errore durante la creazione del profilo. Riprova.' }, { status: 500 });
    }

    // 3c. Set user_active_salon so the next request to getCallerProfile
    //     resolves cleanly without falling back through the COALESCE chain.
    await supabaseAdmin
      .from('user_active_salon')
      .upsert({ user_id: userId, salon_id: salonId }, { onConflict: 'user_id' });

    // 4. Auto-insert Owner as an Operator (bookable resource on the calendar).
    //    operators.user_id is globally UNIQUE, so a user can only be a bookable
    //    operator at one salon. Skip silently when they're already one elsewhere
    //    — that's the case for owners registering an additional salon.
    const { data: existingOperator } = await supabaseAdmin
      .from('operators')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingOperator) {
      const { error: operatorError } = await supabaseAdmin
        .from('operators')
        .insert({
          salon_id:  salonId,
          user_id:   userId,
          firstName,
          lastName,
          email,
        });

      if (operatorError) {
        console.error('Operator auto-insert failed (non-fatal):', operatorError);
      }
    }

    // 5. Persist legal acceptances. Non-fatal: if this fails the user is still
    //    created (the acceptance happened on the client and the request body
    //    proves it), but we surface the issue in logs so we can backfill.
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      null;
    const userAgent = request.headers.get('user-agent');
    const acceptanceRows = [
      { document_type: 'terms',                document_version: LEGAL_VERSIONS.terms },
      { document_type: 'privacy',              document_version: LEGAL_VERSIONS.privacy },
      { document_type: 'dpa',                  document_version: LEGAL_VERSIONS.dpa },
      { document_type: 'vessatorie_1341_1342', document_version: LEGAL_VERSIONS.terms },
    ].map((row) => ({
      ...row,
      user_id:    userId,
      salon_id:   salonId,
      ip_address: ipAddress,
      user_agent: userAgent,
    }));
    const { error: acceptanceError } = await supabaseAdmin
      .from('legal_acceptances')
      .insert(acceptanceRows);
    if (acceptanceError) {
      console.error('Legal-acceptance insert failed (non-fatal):', acceptanceError);
    }

    return NextResponse.json({ success: true, salonId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unexpected registration error:', msg);
    // Best-effort rollback on unexpected errors
    if (salonId || (userId && createdAuthUser)) {
      const supabaseAdmin = getAdminClient();
      if (salonId) await rollbackSalon(supabaseAdmin, salonId);
      if (userId && createdAuthUser) await rollbackUser(supabaseAdmin, userId);
    }
    return NextResponse.json({ success: false, error: 'Si è verificato un errore imprevisto. Riprova.' }, { status: 500 });
  }
}

async function rollbackUser(admin: ReturnType<typeof getAdminClient>, userId: string) {
  try {
    await admin.auth.admin.deleteUser(userId);
  } catch (e) {
    console.error('Rollback: failed to delete auth user', userId, e);
  }
}

async function rollbackSalon(admin: ReturnType<typeof getAdminClient>, salonId: string) {
  try {
    await admin.from('salons').delete().eq('id', salonId);
  } catch (e) {
    console.error('Rollback: failed to delete salon', salonId, e);
  }
}

async function rollbackProfile(admin: ReturnType<typeof getAdminClient>, userId: string) {
  try {
    await admin.from('profiles').delete().eq('id', userId);
  } catch (e) {
    console.error('Rollback: failed to delete profile', userId, e);
  }
}
