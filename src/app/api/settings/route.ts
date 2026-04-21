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

  const effectiveRole = normalizeProfileRole(profile);
  const salonId = await getActiveSalonId(profile.salon_id, effectiveRole === 'admin');
  return { user, profile: { ...profile, role: effectiveRole ?? profile.role }, salonId, admin };
}

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const { data: salon } = await ctx.admin
    .from('salons')
    .select('name, operating_hours, track_inventory')
    .eq('id', ctx.salonId)
    .single();

  if (!salon) return NextResponse.json({ error: 'Salone non trovato' }, { status: 404 });

  return NextResponse.json({ name: salon.name, operating_hours: salon.operating_hours, track_inventory: salon.track_inventory ?? false });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  if (!canManageSalon(ctx.profile.role as 'admin' | 'owner' | 'operator')) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  const body = await req.json();
  const { name, operating_hours, track_inventory } = body;

  if (operating_hours !== undefined && (!Array.isArray(operating_hours) || operating_hours.length !== 7)) {
    return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
  }

  let normalizedName: string | undefined;
  if (name !== undefined) {
    if (typeof name !== 'string') {
      return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
    }
    normalizedName = name.trim();
    if (normalizedName.length < 1 || normalizedName.length > 80) {
      return NextResponse.json({ error: 'Il nome del salone deve contenere tra 1 e 80 caratteri' }, { status: 400 });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};
  if (normalizedName !== undefined) updates.name = normalizedName;
  if (operating_hours !== undefined) updates.operating_hours = operating_hours;
  if (track_inventory !== undefined) updates.track_inventory = Boolean(track_inventory);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nessun dato da aggiornare' }, { status: 400 });
  }

  const { error } = await ctx.admin
    .from('salons')
    .update(updates)
    .eq('id', ctx.salonId);

  if (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Errore durante il salvataggio' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
