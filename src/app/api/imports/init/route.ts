import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';
import { isSalonStaff } from '@/lib/auth/roles';

const SUPPORTED_ENTITIES = new Set(['clients']);
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB (matches storage bucket limit)

function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * POST /api/imports/init
 *
 * Body: { filename: string, sizeBytes: number, entity: 'clients' }
 *
 * Creates an `import_jobs` row in `uploading` state and returns a Supabase
 * Storage signed upload URL the browser can PUT the file to directly. This
 * bypasses Vercel's 4.5 MB request body cap.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || !isSalonStaff(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const filename = typeof body?.filename === 'string' ? body.filename.trim() : '';
    const sizeBytes = typeof body?.sizeBytes === 'number' ? body.sizeBytes : 0;
    const entity = typeof body?.entity === 'string' ? body.entity : '';

    if (!filename || !entity) {
      return NextResponse.json({ success: false, error: 'Campi mancanti' }, { status: 400 });
    }
    if (!SUPPORTED_ENTITIES.has(entity)) {
      return NextResponse.json({ success: false, error: `Entity '${entity}' non supportata` }, { status: 400 });
    }
    if (sizeBytes > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'File troppo grande (max 50 MB)' }, { status: 400 });
    }

    const admin = getAdminSupabase();

    // Insert the job row first so we have a stable id for the storage path
    const { data: job, error: insertError } = await admin
      .from('import_jobs')
      .insert({
        salon_id: profile.salon_id,
        created_by: profile.id,
        entity,
        source_filename: filename,
        source_size_bytes: sizeBytes || null,
        storage_path: 'pending', // updated below once we know the path
        status: 'uploading',
      })
      .select('id')
      .single();

    if (insertError || !job) {
      return NextResponse.json({ success: false, error: insertError?.message ?? 'Errore creazione job' }, { status: 500 });
    }

    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${profile.salon_id}/${job.id}/${safeFilename}`;

    // Patch the storage_path now that we know it
    await admin.from('import_jobs').update({ storage_path: storagePath }).eq('id', job.id);

    // Generate a signed upload URL valid for 10 minutes
    const { data: signed, error: signError } = await admin.storage
      .from('imports')
      .createSignedUploadUrl(storagePath);

    if (signError || !signed) {
      // Clean up the orphan job row
      await admin.from('import_jobs').delete().eq('id', job.id);
      return NextResponse.json({ success: false, error: signError?.message ?? 'Errore signed URL' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      jobId: job.id,
      storagePath,
      uploadUrl: signed.signedUrl,
      uploadToken: signed.token,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[imports/init] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
