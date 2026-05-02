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
 * POST /api/imports/[jobId]/cancel — user abandons the import.
 * Marks the job cancelled and removes the uploaded file from Storage.
 */
export async function POST(
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
    const admin = getAdminSupabase();

    const { data: job } = await admin
      .from('import_jobs')
      .select('id, salon_id, status, storage_path')
      .eq('id', jobId)
      .single();

    if (!job) return NextResponse.json({ success: false, error: 'Job non trovato' }, { status: 404 });
    if (job.salon_id !== profile.salon_id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if (job.status === 'completed' || job.status === 'committing') {
      return NextResponse.json({ success: false, error: `Impossibile annullare un job in stato '${job.status}'` }, { status: 409 });
    }

    if (job.storage_path && job.storage_path !== 'pending') {
      await admin.storage.from('imports').remove([job.storage_path]);
    }
    await admin
      .from('import_jobs')
      .update({ status: 'cancelled', completed_at: new Date().toISOString() })
      .eq('id', jobId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[imports/cancel] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
