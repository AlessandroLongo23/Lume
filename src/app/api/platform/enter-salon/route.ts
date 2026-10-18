import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/gateway/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days — admin impersonation sessions

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const { salonId } = await request.json().catch(() => ({ salonId: null }));
  if (!salonId || typeof salonId !== 'string') {
    return NextResponse.json({ error: 'salonId mancante' }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();
  const { data: salon } = await supabaseAdmin
    .from('salons')
    .select('id')
    .eq('id', salonId)
    .maybeSingle();

  if (!salon) {
    return NextResponse.json({ error: 'Salone non trovato' }, { status: 404 });
  }

  // Write the RLS truth row FIRST. If this fails we return an error and do
  // not set any cookies, keeping UI and data consistent (both off).
  const { error: upsertError } = await supabaseAdmin
    .from('super_admin_impersonation')
    .upsert(
      { user_id: guard.user.id, salon_id: salonId },
      { onConflict: 'user_id' },
    );

  if (upsertError) {
    console.error('enter-salon upsert error:', upsertError);
    return NextResponse.json({ error: 'Impossibile attivare il salone' }, { status: 500 });
  }

  const cookieStore = await cookies();
  const baseCookie = {
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path:     '/',
    maxAge:   COOKIE_MAX_AGE,
  };
  cookieStore.set('lume-active-salon-id', salonId, { ...baseCookie, httpOnly: true });
  cookieStore.set('lume-impersonating',   '1',     { ...baseCookie, httpOnly: false });

  return NextResponse.json({ redirect: '/admin/calendario' });
}
