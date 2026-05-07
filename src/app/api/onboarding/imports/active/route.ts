import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';
import { isSalonStaff } from '@/lib/auth/roles';

/**
 * GET /api/onboarding/imports/active
 *
 * Returns the salon's currently in-flight onboarding (if any) so the admin
 * shell can render the live progress banner without the client knowing the
 * id ahead of time.
 *
 * "Active" = status NOT IN any terminal state. The 'reviewing' state is
 * included — that's the state where some files are auto-committed but others
 * need user confirmation, and the banner is what nudges them. Terminal states
 * (completed, partial_failure, failed, skipped) are excluded so the banner
 * disappears as soon as the run is done — the DoneView already informed the
 * user about partial outcomes.
 */
export async function GET() {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);
    if (!profile || !isSalonStaff(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { data } = await supabase
      .from('onboarding_imports')
      .select('id, salon_id, status, file_count, classified_count, committed_count, summary_json, started_at')
      .eq('salon_id', profile.salon_id)
      .not('status', 'in', '(completed,partial_failure,failed,skipped)')
      .maybeSingle();

    return NextResponse.json({ success: true, onboarding: data ?? null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[onboarding/imports/active] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
