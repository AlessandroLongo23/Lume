import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error.message)}`);
    }

    if (next) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    const role = data?.user?.user_metadata?.role;
    return NextResponse.redirect(`${origin}${role === 'operator' ? '/admin/bilancio' : '/client/prodotti'}`);
  }

  return NextResponse.redirect(`${origin}/`);
}
