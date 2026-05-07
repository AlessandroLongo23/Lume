import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';
import { isOwner } from '@/lib/auth/roles';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB per file (matches storage bucket cap)
const MAX_FILES = 20;

function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface InboundFile {
  filename: string;
  sizeBytes: number;
}

/**
 * POST /api/onboarding/imports/init
 *
 * Body: { files: [{ filename, sizeBytes }, ...] }
 *
 * Creates an `onboarding_imports` parent row and one `import_jobs` child per
 * uploaded file (entity left null — the LLM classifier fills it in later).
 * Returns a signed Storage upload URL per file so the browser can PUT the
 * files in parallel without going through Vercel's request body cap.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);
    if (!profile || !isOwner(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const files: InboundFile[] = Array.isArray(body?.files) ? body.files : [];
    if (files.length === 0 || files.length > MAX_FILES) {
      return NextResponse.json(
        { success: false, error: `Carica tra 1 e ${MAX_FILES} file` },
        { status: 400 },
      );
    }
    for (const f of files) {
      if (typeof f.filename !== 'string' || !f.filename.trim()) {
        return NextResponse.json({ success: false, error: 'Nome file mancante' }, { status: 400 });
      }
      if (typeof f.sizeBytes !== 'number' || f.sizeBytes <= 0 || f.sizeBytes > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: `File "${f.filename}" troppo grande (max 50 MB)` },
          { status: 400 },
        );
      }
    }

    const admin = getAdminSupabase();

    // Refuse to start a new onboarding if there's already an open one (the
    // partial unique index would catch this anyway, but a friendly error here
    // saves a round-trip).
    const { data: existing } = await admin
      .from('onboarding_imports')
      .select('id, status')
      .eq('salon_id', profile.salon_id)
      .not('status', 'in', '(completed,skipped,failed)')
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'C’è già un import in corso', onboardingId: existing.id },
        { status: 409 },
      );
    }

    // Step 1 — create the parent row
    const { data: parent, error: parentError } = await admin
      .from('onboarding_imports')
      .insert({
        salon_id: profile.salon_id,
        created_by: profile.id,
        status: 'uploading',
        file_count: files.length,
      })
      .select('id')
      .single();
    if (parentError || !parent) {
      return NextResponse.json(
        { success: false, error: parentError?.message ?? 'Errore creazione onboarding' },
        { status: 500 },
      );
    }

    // Step 2 — create one child import_jobs row per file + signed upload URL
    const childResults: Array<{
      slot: number;
      jobId: string;
      filename: string;
      storagePath: string;
      uploadUrl: string;
      uploadToken: string;
    }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const safeFilename = file.filename.replace(/[^a-zA-Z0-9._-]/g, '_');

      const { data: child, error: childError } = await admin
        .from('import_jobs')
        .insert({
          salon_id: profile.salon_id,
          created_by: profile.id,
          source_filename: file.filename,
          source_size_bytes: file.sizeBytes,
          storage_path: 'pending',
          status: 'uploading',
          onboarding_id: parent.id,
        })
        .select('id')
        .single();
      if (childError || !child) {
        // Rollback: delete the parent and any children created so far
        await admin.from('onboarding_imports').delete().eq('id', parent.id);
        return NextResponse.json(
          { success: false, error: childError?.message ?? 'Errore creazione job' },
          { status: 500 },
        );
      }

      const storagePath = `${profile.salon_id}/onboarding/${parent.id}/${i}-${safeFilename}`;
      await admin.from('import_jobs').update({ storage_path: storagePath }).eq('id', child.id);

      const { data: signed, error: signError } = await admin.storage
        .from('imports')
        .createSignedUploadUrl(storagePath);
      if (signError || !signed) {
        await admin.from('onboarding_imports').delete().eq('id', parent.id);
        return NextResponse.json(
          { success: false, error: signError?.message ?? 'Errore signed URL' },
          { status: 500 },
        );
      }

      childResults.push({
        slot: i,
        jobId: child.id,
        filename: file.filename,
        storagePath,
        uploadUrl: signed.signedUrl,
        uploadToken: signed.token,
      });
    }

    return NextResponse.json({
      success: true,
      onboardingId: parent.id,
      files: childResults,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[onboarding/imports/init] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
