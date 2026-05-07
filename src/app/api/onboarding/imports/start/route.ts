import { NextRequest, NextResponse, after } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';
import { isOwner } from '@/lib/auth/roles';
import { isWorkbook, listSheetNames } from '@/lib/imports/core/splitWorkbook';
import { runOnboarding } from '@/lib/imports/onboarding/runOnboarding';

export const maxDuration = 300;

function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface ChildRow {
  id: string;
  storage_path: string;
  source_filename: string;
  status: string;
  source_sheet_name: string | null;
}

/**
 * POST /api/onboarding/imports/start  { onboardingId }
 *
 * Verifies all uploads landed, splits any multi-sheet workbooks into one
 * import_jobs row per sheet (so the classifier and column-mapper can treat
 * each sheet independently), transitions the parent to `classifying`, and
 * fires the Inngest classification event.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);
    if (!profile || !isOwner(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const onboardingId = typeof body?.onboardingId === 'string' ? body.onboardingId : '';
    if (!onboardingId) {
      return NextResponse.json({ success: false, error: 'onboardingId mancante' }, { status: 400 });
    }

    const admin = getAdminSupabase();

    // Auth-check the parent
    const { data: parent } = await admin
      .from('onboarding_imports')
      .select('id, salon_id, status')
      .eq('id', onboardingId)
      .maybeSingle();
    if (!parent) {
      return NextResponse.json({ success: false, error: 'Onboarding non trovato' }, { status: 404 });
    }
    if (parent.salon_id !== profile.salon_id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if (parent.status !== 'uploading') {
      return NextResponse.json(
        { success: false, error: `Onboarding già in stato '${parent.status}'` },
        { status: 409 },
      );
    }

    // Fetch all children
    const { data: childrenData } = await admin
      .from('import_jobs')
      .select('id, storage_path, source_filename, status, source_sheet_name')
      .eq('onboarding_id', onboardingId);
    const children = (childrenData ?? []) as ChildRow[];

    if (children.length === 0) {
      return NextResponse.json({ success: false, error: 'Nessun file in attesa' }, { status: 400 });
    }

    // Verify each upload landed in Storage. Files that didn't make it get the
    // child marked failed but we keep going — siblings shouldn't be punished
    // for one bad upload.
    let validCount = 0;
    for (const child of children) {
      const folder = child.storage_path.split('/').slice(0, -1).join('/');
      const filename = child.storage_path.split('/').pop()!;
      const { data: listing } = await admin.storage
        .from('imports')
        .list(folder, { search: filename });
      const found = (listing ?? []).some((f) => f.name === filename);
      if (!found) {
        await admin
          .from('import_jobs')
          .update({ status: 'failed', failure_reason: 'Upload non completato' })
          .eq('id', child.id);
        continue;
      }
      validCount++;
    }
    if (validCount === 0) {
      await admin
        .from('onboarding_imports')
        .update({ status: 'failed', failure_reason: 'Nessun file caricato' })
        .eq('id', onboardingId);
      return NextResponse.json({ success: false, error: 'Nessun file caricato' }, { status: 400 });
    }

    // Split multi-sheet workbooks. For each xlsx child we list sheet names,
    // and if there's more than one non-trivial sheet we replace the original
    // child with N children — one per sheet. CSV/single-sheet files are left
    // alone.
    let totalChildren = 0;
    for (const child of children) {
      if (child.status === 'failed') continue;

      if (!isWorkbook(child.source_filename)) {
        await admin.from('import_jobs').update({ status: 'queued' }).eq('id', child.id);
        totalChildren++;
        continue;
      }

      let sheetNames: string[] = [];
      try {
        const { data: blob } = await admin.storage.from('imports').download(child.storage_path);
        if (blob) {
          sheetNames = listSheetNames(await blob.arrayBuffer());
        }
      } catch (err) {
        console.warn('[onboarding/start] sheet listing failed', { jobId: child.id, err: String(err) });
      }

      if (sheetNames.length <= 1) {
        // Single-sheet workbook — keep as-is, just move to queued
        await admin.from('import_jobs').update({ status: 'queued' }).eq('id', child.id);
        totalChildren++;
        continue;
      }

      // Multi-sheet: create N siblings, one per sheet, sharing storage_path.
      // Drop the original child by deleting it (the new ones replace it).
      const newChildren = sheetNames.map((sheetName) => ({
        salon_id: profile.salon_id,
        created_by: profile.id,
        source_filename: child.source_filename,
        source_size_bytes: null,
        storage_path: child.storage_path,
        status: 'queued',
        onboarding_id: onboardingId,
        source_sheet_name: sheetName,
      }));
      const { error: insertError } = await admin.from('import_jobs').insert(newChildren);
      if (insertError) {
        console.error('[onboarding/start] sheet split insert failed', insertError);
        await admin.from('import_jobs').update({ status: 'queued' }).eq('id', child.id);
        totalChildren++;
        continue;
      }
      await admin.from('import_jobs').delete().eq('id', child.id);
      totalChildren += sheetNames.length;
    }

    await admin
      .from('onboarding_imports')
      .update({ status: 'classifying', file_count: totalChildren })
      .eq('id', onboardingId);

    // Run classify → process → commit in the background. The browser is
    // redirected to the progress screen immediately and watches the parent
    // row via Realtime / polling.
    after(runOnboarding(onboardingId, profile.salon_id));

    return NextResponse.json({ success: true, fileCount: totalChildren });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[onboarding/imports/start] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
