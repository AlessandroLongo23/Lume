import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { BusinessType } from '@/lib/types/Salon';
import { requireSuperAdmin } from '@/lib/gateway/requireSuperAdmin';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// Generate a random temporary password for the new owner account.
// Actual access is via the password reset email the owner will receive separately.
function randomPassword(): string {
  return crypto.randomUUID() + crypto.randomUUID();
}

export async function POST(request: NextRequest) {
  const guard = await requireSuperAdmin();
  if (guard.response) return guard.response;

  const body = await request.json().catch(() => ({}));
  const { name, ownerEmail, ownerFirstName, ownerLastName, businessType } = body as {
    name?: string; ownerEmail?: string; ownerFirstName?: string; ownerLastName?: string; businessType?: BusinessType;
  };

  if (!name || !ownerEmail || !ownerFirstName || !ownerLastName || !businessType) {
    return NextResponse.json({ error: 'Campi mancanti' }, { status: 400 });
  }

  const supabaseAdmin = getAdminClient();
  let createdAuthUserId: string | null = null;

  try {
    // 1. Reuse existing user if present, else create new auth user
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', ownerEmail)
      .maybeSingle();

    let userId: string;
    if (existingProfile?.id) {
      userId = existingProfile.id;
    } else {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email:         ownerEmail,
        password:      randomPassword(),
        email_confirm: true,
        user_metadata: { role: 'owner', firstName: ownerFirstName, lastName: ownerLastName },
      });
      if (authError || !authData.user) throw authError ?? new Error('createUser failed');
      userId = authData.user.id;
      createdAuthUserId = userId;
    }

    // 2. Insert salon
    const { data: salonData, error: salonError } = await supabaseAdmin
      .from('salons')
      .insert({ name, type: businessType, origin: 'word_of_mouth', owner_id: userId })
      .select('id')
      .single();
    if (salonError || !salonData) throw salonError ?? new Error('salon insert failed');

    // 3. Insert (or upsert) profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id:         userId,
        salon_id:   salonData.id,
        first_name: ownerFirstName,
        last_name:  ownerLastName,
        email:      ownerEmail,
        role:       'owner',
      });
    if (profileError) throw profileError;

    return NextResponse.json({ id: salonData.id }, { status: 201 });
  } catch (err) {
    console.error('Platform salon create failed:', err);
    if (createdAuthUserId) {
      await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId).catch(() => {});
    }
    return NextResponse.json({ error: 'Creazione fallita' }, { status: 500 });
  }
}
