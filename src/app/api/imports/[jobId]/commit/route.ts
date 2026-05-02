import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';
import { isSalonStaff } from '@/lib/auth/roles';
import { inngest } from '@/lib/inngest/client';

function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * POST /api/imports/[jobId]/commit  { mappings }
 *
 * Confirms the user-edited column map and dispatches `import/commit.requested`.
 * Allows the user to override the LLM's suggestions before bulk insert.
 */
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ jobId: string }> },
) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || !isSalonStaff(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { jobId } = await ctx.params;
    const body = await request.json();
    const mappings = Array.isArray(body?.mappings) ? body.mappings : null;
    if (!mappings) return NextResponse.json({ success: false, error: 'mappings mancante' }, { status: 400 });

    const admin = getAdminSupabase();
    const { data: job, error } = await admin
      .from('import_jobs')
      .select('id, salon_id, entity, status, mapping_json')
      .eq('id', jobId)
      .single();

    if (error || !job) return NextResponse.json({ success: false, error: 'Job non trovato' }, { status: 404 });
    if (job.salon_id !== profile.salon_id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if (job.status !== 'awaiting_review' && job.status !== 'partial_failure') {
      return NextResponse.json({ success: false, error: `Job in stato '${job.status}'` }, { status: 409 });
    }

    // Persist the user-confirmed mappings before dispatching
    await admin
      .from('import_jobs')
      .update({
        mapping_json: { ...(job.mapping_json ?? {}), mappings, confirmedByUser: true },
        status: 'committing',
      })
      .eq('id', jobId);

    await inngest.send({
      name: 'import/commit.requested',
      data: {
        jobId,
        salonId: job.salon_id,
        entity: job.entity,
        mappings,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[imports/commit] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
