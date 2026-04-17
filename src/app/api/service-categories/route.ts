import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getCallerProfile(supabase: Awaited<ReturnType<typeof createServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const supabaseAdmin = getAdminClient();
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('salon_id, role')
    .eq('id', user.id)
    .single();

  return profile;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { category } = await request.json();
    const supabaseAdmin = getAdminClient();

    const { data, error: dbError } = await supabaseAdmin
      .from('service_categories')
      .insert({ ...category, salon_id: profile.salon_id })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, category: data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating service category:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * PATCH: update | archive | restore.
 *
 * Archive cascades: all services in the category are archived in the same request.
 * Restore does NOT un-archive services automatically — this preserves services
 * that were individually archived before the category was archived.
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id, action, category } = await request.json();
    const supabaseAdmin = getAdminClient();

    if (action === 'archive' || action === 'restore') {
      if (!id) {
        return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
      }
      const ts = new Date().toISOString();
      const archived_at = action === 'archive' ? ts : null;

      const { error: dbError } = await supabaseAdmin
        .from('service_categories')
        .update({ archived_at })
        .eq('id', id)
        .eq('salon_id', profile.salon_id);
      if (dbError) throw dbError;

      // Cascade on archive only
      if (action === 'archive') {
        const { error: cascadeError } = await supabaseAdmin
          .from('services')
          .update({ archived_at: ts })
          .eq('category_id', id)
          .eq('salon_id', profile.salon_id)
          .is('archived_at', null);
        if (cascadeError) throw cascadeError;
      }

      return NextResponse.json({ success: true });
    }

    // Update
    if (!id || !category) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }
    const { data, error: dbError } = await supabaseAdmin
      .from('service_categories')
      .update(category)
      .eq('id', id)
      .eq('salon_id', profile.salon_id)
      .select()
      .single();
    if (dbError) throw dbError;
    return NextResponse.json({ success: true, category: data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating/archiving service category:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'Category ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    // Cascade: find services in this category, their fiche_services, fiches, then services, then category
    const { data: services, error: sErr } = await supabaseAdmin
      .from('services')
      .select('id')
      .eq('category_id', id)
      .eq('salon_id', profile.salon_id);
    if (sErr) throw sErr;

    const serviceIds = (services ?? []).map((s: { id: string }) => s.id);

    if (serviceIds.length > 0) {
      const { data: ficheServices, error: fsErr } = await supabaseAdmin
        .from('fiche_services')
        .select('fiche_id')
        .in('service_id', serviceIds);
      if (fsErr) throw fsErr;

      const ficheIds = [...new Set((ficheServices ?? []).map((fs: { fiche_id: string }) => fs.fiche_id))];

      if (ficheIds.length > 0) {
        const { error: fsDelErr } = await supabaseAdmin
          .from('fiche_services')
          .delete()
          .in('fiche_id', ficheIds);
        if (fsDelErr) throw fsDelErr;

        const { error: fDelErr } = await supabaseAdmin
          .from('fiches')
          .delete()
          .in('id', ficheIds)
          .eq('salon_id', profile.salon_id);
        if (fDelErr) throw fDelErr;
      }

      const { error: svDelErr } = await supabaseAdmin
        .from('services')
        .delete()
        .in('id', serviceIds)
        .eq('salon_id', profile.salon_id);
      if (svDelErr) throw svDelErr;
    }

    const { error: dbError } = await supabaseAdmin
      .from('service_categories')
      .delete()
      .eq('id', id)
      .eq('salon_id', profile.salon_id);
    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting service category:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
