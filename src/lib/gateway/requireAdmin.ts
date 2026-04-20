import 'server-only';
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/gateway/admins';

/**
 * Guards a platform API route. Returns either a NextResponse (401/404 to send
 * back) or the authenticated user when they are a confirmed admin.
 */
export async function requireAdmin(): Promise<
  | { response: NextResponse; user?: undefined }
  | { user: { id: string; email: string | undefined }; response?: undefined }
> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { response: NextResponse.json({ error: 'Non autenticato' }, { status: 401 }) };
  }
  if (!(await isAdmin(user.id))) {
    return { response: new NextResponse(null, { status: 404 }) };
  }
  return { user: { id: user.id, email: user.email } };
}
