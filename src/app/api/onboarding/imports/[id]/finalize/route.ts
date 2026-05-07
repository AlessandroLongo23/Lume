import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';
import { isOwner } from '@/lib/auth/roles';

function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * POST /api/onboarding/imports/:id/finalize
 *
 * Called by the done screen when the owner clicks "Apri il calendario". Sets
 * salons.onboarded_at unconditionally so subsequent logins skip /onboarding/import,
 * even if the commit is still running in the background.
 *
 * The commitOnboarding worker also sets onboarded_at when it finishes — but
 * a user clicking "Apri il calendario" before the worker has flipped the
 * column should still get out of the onboarding gate.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);
    if (!profile || !isOwner(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const admin = getAdminSupabase();

    const { data: parent } = await admin
      .from('onboarding_imports')
      .select('id, salon_id')
      .eq('id', id)
      .maybeSingle();
    if (!parent) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    if (parent.salon_id !== profile.salon_id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await admin
      .from('salons')
      .update({ onboarded_at: new Date().toISOString() })
      .eq('id', profile.salon_id)
      .is('onboarded_at', null);

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[onboarding/imports/:id/finalize] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
