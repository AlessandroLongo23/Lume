import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const response = NextResponse.json({ ok: true });
  // Clear any lingering impersonation cookies so the next login starts clean.
  // `lume-active-salon-id` is httpOnly (client JS can't remove it) and its
  // 30-day TTL would otherwise outlive the session.
  response.cookies.delete('lume-active-salon-id');
  response.cookies.delete('lume-impersonating');
  return response;
}
