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
 * POST /api/imports/start  { jobId }
 *
 * Verifies the file was uploaded, transitions the job to `queued`, and
 * dispatches the Inngest `import/process.requested` event. Returning quickly
 * is important — the actual parsing happens in the background.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || !isSalonStaff(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const jobId = typeof body?.jobId === 'string' ? body.jobId : '';
    if (!jobId) return NextResponse.json({ success: false, error: 'jobId mancante' }, { status: 400 });

    const admin = getAdminSupabase();
    const { data: job, error } = await admin
      .from('import_jobs')
      .select('id, salon_id, entity, status, storage_path')
      .eq('id', jobId)
      .single();

    if (error || !job) return NextResponse.json({ success: false, error: 'Job non trovato' }, { status: 404 });
    if (job.salon_id !== profile.salon_id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if (job.status !== 'uploading') {
      return NextResponse.json({ success: false, error: `Job già in stato '${job.status}'` }, { status: 409 });
    }

    // Verify the upload landed by listing the parent folder
    const folder = job.storage_path.split('/').slice(0, -1).join('/');
    const filename = job.storage_path.split('/').pop()!;
    const { data: listing } = await admin.storage.from('imports').list(folder, { search: filename });
    const found = (listing ?? []).some((f) => f.name === filename);
    if (!found) {
      return NextResponse.json({ success: false, error: 'File non caricato' }, { status: 400 });
    }

    await admin.from('import_jobs').update({ status: 'queued' }).eq('id', jobId);

    await inngest.send({
      name: 'import/process.requested',
      data: { jobId, salonId: job.salon_id, entity: job.entity },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[imports/start] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
