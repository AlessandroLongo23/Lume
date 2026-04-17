import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/gateway/superAdmins';

/**
 * Guards a platform API route. Returns either a NextResponse (401/403 to send
 * back) or the authenticated user when they are a confirmed super-admin.
 */
export async function requireSuperAdmin(): Promise<
  | { response: NextResponse; user?: undefined }
  | { user: { id: string; email: string | undefined }; response?: undefined }
> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { response: NextResponse.json({ error: 'Non autenticato' }, { status: 401 }) };
  }
  if (!(await isSuperAdmin(user.id))) {
    return { response: new NextResponse(null, { status: 404 }) };
  }
  return { user: { id: user.id, email: user.email } };
}
