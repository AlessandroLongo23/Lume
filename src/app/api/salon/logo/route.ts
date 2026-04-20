import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { getActiveSalonId } from '@/lib/utils/getActiveSalonId';
import { normalizeProfileRole, canManageSalon } from '@/lib/auth/roles';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const admin = getAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('salon_id, role')
      .eq('id', user.id)
      .single();

    if (!profile) return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 });
    const effectiveRole = normalizeProfileRole(profile);
    if (!canManageSalon(effectiveRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const salonId = await getActiveSalonId(profile.salon_id, effectiveRole === 'admin');
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
