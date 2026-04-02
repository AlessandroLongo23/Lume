import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { BusinessType, OriginType } from '@/lib/types/Salon';

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
    const { email, password, firstName, lastName, salonName, businessType, origin, inviteCode } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !salonName || !businessType || !origin) {
      return NextResponse.json({ success: false, error: 'Tutti i campi obbligatori devono essere compilati.' }, { status: 400 });
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

    // 3. Insert profile
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

    // 4. Auto-insert Owner as an Operator (bookable resource on the calendar)
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
