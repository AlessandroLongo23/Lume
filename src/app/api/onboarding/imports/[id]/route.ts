import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';
import { isSalonStaff } from '@/lib/auth/roles';

/**
 * GET /api/onboarding/imports/:id
 *
 * Returns the parent row plus all child import_jobs (id, entity, status,
 * auto_commit_eligible, processed_rows, mapping_json.classification.reason)
 * so the magic + done screens can render counts and review prompts.
 *
 * Used both by the live UI and as a Realtime fallback poll.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);
    if (!profile || !isSalonStaff(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const { data: parent } = await supabase
      .from('onboarding_imports')
      .select('id, salon_id, status, file_count, classified_count, committed_count, summary_json, failure_reason, created_at, started_at, completed_at')
      .eq('id', id)
      .maybeSingle();
    if (!parent) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    if (parent.salon_id !== profile.salon_id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { data: children } = await supabase
      .from('import_jobs')
      .select('id, entity, status, auto_commit_eligible, processed_rows, total_rows, source_filename, source_sheet_name, mapping_json, failure_reason')
      .eq('onboarding_id', id)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      success: true,
      onboarding: parent,
      children: children ?? [],
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[onboarding/imports/:id] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
