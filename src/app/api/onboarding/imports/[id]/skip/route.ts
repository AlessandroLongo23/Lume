import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';
import { isOwner } from '@/lib/auth/roles';

function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * POST /api/onboarding/imports/:id/skip
 *
 * Marks the onboarding as skipped and stamps salons.onboarded_at +
 * onboarding_dismissed_at so the resolveWorkspace gate stops redirecting
 * the owner here. The "Importa i tuoi dati" sidebar entry can still bring
 * them back if they change their mind.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);
    if (!profile || !isOwner(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
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

    const now = new Date().toISOString();
    await admin
      .from('onboarding_imports')
      .update({ status: 'skipped', completed_at: now })
      .eq('id', id);

    await admin
      .from('salons')
      .update({ onboarded_at: now, onboarding_dismissed_at: now })
      .eq('id', profile.salon_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[onboarding/imports/:id/skip] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
