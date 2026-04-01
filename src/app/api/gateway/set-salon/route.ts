import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { salonId } = await request.json();
    if (!salonId || typeof salonId !== 'string') {
      return NextResponse.json({ error: 'salonId mancante' }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set('lume-active-salon-id', salonId, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   COOKIE_MAX_AGE,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('set-salon error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
