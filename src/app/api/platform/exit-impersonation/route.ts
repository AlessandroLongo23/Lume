import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireSuperAdmin } from '@/lib/gateway/requireSuperAdmin';

export async function POST() {
  const guard = await requireSuperAdmin();
  if (guard.response) return guard.response;

  const cookieStore = await cookies();
  cookieStore.delete('lume-active-salon-id');
  cookieStore.delete('lume-impersonating');

  return NextResponse.json({ redirect: '/platform/salons' });
}
