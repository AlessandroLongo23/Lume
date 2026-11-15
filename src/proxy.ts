import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/gateway/admins';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not add logic between createServerClient and auth.getUser().
  // auth.getUser() refreshes the session cookie — supabaseResponse must be
  // returned unchanged so the refreshed cookie is forwarded to the browser.
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Gate /platform: only platform admins may see it exists. 404 everyone else.
  if (request.nextUrl.pathname.startsWith('/platform')) {
    if (!(await isAdmin(user.id))) {
      return new NextResponse(null, { status: 404 });
    }
  }

  return supabaseResponse;
}

// Link prefetches skip the proxy: every full load of the admin prefetches all
// sidebar pages, and running auth on each one was a Vercel function call apiece.
// Prefetched admin pages are static shells with no salon data (stores read
// through RLS), and the /platform layout repeats its own admin check.
// The matcher must stay a literal: Next reads it statically at build time.
export const config = {
  matcher: [
    {
      source: '/admin/:path*',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
    {
      source: '/platform/:path*',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
