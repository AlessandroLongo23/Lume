import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { BusinessType, OriginType } from '@/lib/types/Salon';

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

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'owner', firstName, lastName },
    });

    if (authError) {
      if (authError.message.toLowerCase().includes('already') || authError.message.toLowerCase().includes('exists')) {
        return NextResponse.json({ success: false, error: 'Un account con questa email esiste già.' }, { status: 409 });
      }
      console.error('Auth user creation failed:', authError);
      return NextResponse.json({ success: false, error: 'Impossibile creare l\'account. Riprova.' }, { status: 500 });
    }

    userId = authData.user.id;

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
      await rollbackUser(supabaseAdmin, userId);
      return NextResponse.json({ success: false, error: 'Errore durante la creazione del salone. Riprova.' }, { status: 500 });
    }

    salonId = salonData.id;

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
      await rollbackUser(supabaseAdmin, userId);
      return NextResponse.json({ success: false, error: 'Errore durante la creazione del profilo. Riprova.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unexpected registration error:', msg);
    // Best-effort rollback on unexpected errors
    if (salonId || userId) {
      const supabaseAdmin = getAdminClient();
      if (salonId) await rollbackSalon(supabaseAdmin, salonId);
      if (userId) await rollbackUser(supabaseAdmin, userId);
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
