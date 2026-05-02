import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';
import { isSalonStaff } from '@/lib/auth/roles';

function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * GET /api/imports/[jobId]  — full job state for the review/progress UI.
 * Tenant-scoped: a salon never sees another salon's job.
 */
export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ jobId: string }> },
) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || !isSalonStaff(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { jobId } = await ctx.params;
    if (!jobId) return NextResponse.json({ success: false, error: 'jobId mancante' }, { status: 400 });

    const admin = getAdminSupabase();
    const { data: job, error } = await admin
      .from('import_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('salon_id', profile.salon_id)
      .maybeSingle();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    if (!job) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true, job });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[imports/get] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
