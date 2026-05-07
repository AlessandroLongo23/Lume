import { NextRequest, NextResponse, after } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';
import { isOwner } from '@/lib/auth/roles';
import { runOnboarding } from '@/lib/imports/onboarding/runOnboarding';

function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * POST /api/onboarding/imports/:id/confirm  { autoCommitOnly?: boolean }
 *
 * Triggers the commit phase. With `autoCommitOnly: true` (default), only
 * children that passed the auto-eligibility check are committed; uncertain
 * children stay in `awaiting_review` to be reviewed later from the admin
 * banner. With `autoCommitOnly: false`, all children with `awaiting_review`
 * status get committed using their stored mappings.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);
    if (!profile || !isOwner(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    // autoCommitOnly is a wire-protocol input but no longer drives behavior:
    // runOnboarding already commits the eligible subset. A future "review
    // and commit deferred files" flow will diverge here.
    await request.json().catch(() => ({}));

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

    await admin
      .from('onboarding_imports')
      .update({ status: 'committing' })
      .eq('id', id);

    after(runOnboarding(id, profile.salon_id));

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[onboarding/imports/:id/confirm] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
