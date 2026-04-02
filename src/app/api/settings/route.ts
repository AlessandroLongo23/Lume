import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { getActiveSalonId } from '@/lib/utils/getActiveSalonId';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAuthContext() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = getAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('salon_id, role')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  const salonId = await getActiveSalonId(profile.salon_id);
  return { user, profile, salonId, admin };
}

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const { data: salon } = await ctx.admin
    .from('salons')
    .select('name, operating_hours')
    .eq('id', ctx.salonId)
    .single();

  if (!salon) return NextResponse.json({ error: 'Salone non trovato' }, { status: 404 });

  return NextResponse.json({ name: salon.name, operating_hours: salon.operating_hours });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  if (ctx.profile.role !== 'owner') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  const body = await req.json();
  const { operating_hours } = body;

  if (!Array.isArray(operating_hours) || operating_hours.length !== 7) {
    return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
  }

  const { error } = await ctx.admin
    .from('salons')
    .update({ operating_hours })
    .eq('id', ctx.salonId);

  if (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Errore durante il salvataggio' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
