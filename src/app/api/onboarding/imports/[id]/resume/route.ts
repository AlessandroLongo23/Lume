import { NextRequest, NextResponse, after } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';
import { isOwner } from '@/lib/auth/roles';
import { runOnboarding } from '@/lib/imports/onboarding/runOnboarding';

export const maxDuration = 300;

function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const NON_TERMINAL = new Set([
  'pending',
  'uploading',
  'classifying',
  'mapping',
  'reviewing',
  'committing',
]);

/**
 * POST /api/onboarding/imports/:id/resume
 *
 * Re-fires the onboarding orchestrator. Safe to call repeatedly — the
 * orchestrator skips children that have already been classified / processed /
 * committed. Used by the client when an open onboarding is detected on page
 * load (e.g. the user closed the tab mid-run, or a previous request timed out).
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
      .select('id, salon_id, status')
      .eq('id', id)
      .maybeSingle();
    if (!parent) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    if (parent.salon_id !== profile.salon_id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if (!NON_TERMINAL.has(parent.status)) {
      // Nothing to resume — already finished or skipped.
      return NextResponse.json({ success: true, resumed: false, status: parent.status });
    }

    after(runOnboarding(id, profile.salon_id));
    return NextResponse.json({ success: true, resumed: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[onboarding/imports/:id/resume] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
