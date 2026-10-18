import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';
import { canManageSalon } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const caller = await getCallerProfile(supabase);
    if (!caller) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    if (!canManageSalon(caller.role)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const admin = createAdminClient();
    const salonId = caller.salon_id;
    const { logoUrl } = await req.json();

    if (typeof logoUrl !== 'string' && logoUrl !== null) {
      return NextResponse.json({ error: 'URL non valido' }, { status: 400 });
    }

    const { error } = await admin
      .from('salons')
      .update({ logo_url: logoUrl })
      .eq('id', salonId);

    if (error) {
      console.error('Logo update error:', error);
      return NextResponse.json({ error: 'Errore salvataggio logo' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected logo update error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
