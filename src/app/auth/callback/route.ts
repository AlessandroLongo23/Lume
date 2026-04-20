import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveWorkspace } from '@/lib/gateway/resolveWorkspace';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

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

    // Honour explicit ?next= param (e.g., deep-links into admin)
    if (next) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    const result = await resolveWorkspace(data.user.id);

    // Admins always land on /platform on a fresh login, regardless of any
    // stale impersonation cookie — they must explicitly re-enter a salon.
    if (result.isAdmin) {
      const response = NextResponse.redirect(`${origin}/platform`);
      response.cookies.delete('lume-active-salon-id');
      response.cookies.delete('lume-impersonating');
      return response;
    }

    const response = NextResponse.redirect(`${origin}${result.redirect}`);

    // Write the active salon cookie directly on the redirect response
    if (result.activeSalonId) {
      response.cookies.set('lume-active-salon-id', result.activeSalonId, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path:     '/',
        maxAge:   COOKIE_MAX_AGE,
      });
    }

    return response;
  }

  return NextResponse.redirect(`${origin}/login`);
}
