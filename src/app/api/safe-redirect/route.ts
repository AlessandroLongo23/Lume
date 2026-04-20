import { NextResponse } from 'next/server';
import { resolveSafeRedirect } from '@/lib/auth/safeRedirect';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dest = await resolveSafeRedirect();
    return NextResponse.json(dest);
  } catch (error) {
    console.error('safe-redirect error:', error);
    return NextResponse.json(
      { href: '/', label: 'la homepage' },
      { status: 200 },
    );
  }
}
