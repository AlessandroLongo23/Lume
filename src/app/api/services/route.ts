import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';
import { logActivity, diffRows } from '@/lib/gateway/logActivity';
import { canManageSalon } from '@/lib/auth/roles';
import { pickAllowed } from '@/lib/utils/pickAllowed';

const SERVICE_WRITE_FIELDS = [
  'name', 'duration', 'price', 'product_cost', 'category_id', 'description',
  'bookable_online',
] as const;

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || !canManageSalon(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { service } = await request.json();
    const supabaseAdmin = getAdminClient();

    const { data, error: dbError } = await supabaseAdmin
      .from('services')
      .insert({ ...pickAllowed(service, SERVICE_WRITE_FIELDS), salon_id: profile.salon_id })
      .select()
      .single();

    if (dbError) throw dbError;

    await logActivity({
      salonId: profile.salon_id,
      actorId: profile.id,
      entityType: 'services',
      entityId: data.id,
      action: 'create',
      changes: data,
    });

    return NextResponse.json({ success: true, service: data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating service:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || !canManageSalon(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id, action, service, ids, patch } = await request.json();
    const supabaseAdmin = getAdminClient();

    if (action === 'bulk-update') {
      if (!Array.isArray(ids) || ids.length === 0 || !patch)
        return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
      const { error: dbError } = await supabaseAdmin
        .from('services')
        .update(pickAllowed(patch, SERVICE_WRITE_FIELDS))
        .in('id', ids)
        .eq('salon_id', profile.salon_id);
      if (dbError) throw dbError;
      await logActivity({
        salonId: profile.salon_id,
        actorId: profile.id,
        entityType: 'services',
        action: 'bulk',
        changes: { ids, patch: pickAllowed(patch, SERVICE_WRITE_FIELDS) },
        summary: `ha aggiornato ${ids.length} ${ids.length === 1 ? 'servizio' : 'servizi'}`,
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'bulk-archive' || action === 'bulk-restore') {
      if (!Array.isArray(ids) || ids.length === 0)
        return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
      const archived_at = action === 'bulk-archive' ? new Date().toISOString() : null;
      const { error: dbError } = await supabaseAdmin
        .from('services')
        .update({ archived_at })
        .in('id', ids)
        .eq('salon_id', profile.salon_id);
      if (dbError) throw dbError;
      await logActivity({
        salonId: profile.salon_id,
        actorId: profile.id,
        entityType: 'services',
        action: 'bulk',
        changes: { ids },
        summary: `ha ${action === 'bulk-archive' ? 'archiviato' : 'ripristinato'} ${ids.length} ${ids.length === 1 ? 'servizio' : 'servizi'}`,
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'archive' || action === 'restore') {
      if (!id) {
        return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
      }
      const archived_at = action === 'archive' ? new Date().toISOString() : null;
      const { error: dbError } = await supabaseAdmin
        .from('services')
        .update({ archived_at })
        .eq('id', id)
        .eq('salon_id', profile.salon_id);
      if (dbError) throw dbError;
      await logActivity({
        salonId: profile.salon_id,
        actorId: profile.id,
        entityType: 'services',
        entityId: id,
        action: 'update',
        summary: action === 'archive' ? 'ha archiviato il servizio' : 'ha ripristinato il servizio',
      });
      return NextResponse.json({ success: true });
    }

    // Update
    if (!id || !service) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }
    const { data: beforeService } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('id', id)
      .eq('salon_id', profile.salon_id)
      .single();
    const { data, error: dbError } = await supabaseAdmin
      .from('services')
      .update(pickAllowed(service, SERVICE_WRITE_FIELDS))
      .eq('id', id)
      .eq('salon_id', profile.salon_id)
      .select()
      .single();
    if (dbError) throw dbError;
    await logActivity({
      salonId: profile.salon_id,
      actorId: profile.id,
      entityType: 'services',
      entityId: id,
      action: 'update',
      changes: diffRows(beforeService, data),
    });
    return NextResponse.json({ success: true, service: data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating/archiving service:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || !canManageSalon(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id, ids } = await request.json();
    const targetIds: string[] = Array.isArray(ids) && ids.length > 0 ? ids : (id ? [id] : []);
    if (targetIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Service ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    const { data: servicesToDelete } = await supabaseAdmin
      .from('services')
      .select('id, name')
      .in('id', targetIds)
      .eq('salon_id', profile.salon_id);

    // Cascade: find fiches that reference any of these services, delete fiche_services + fiches
    const { data: ficheServicesData, error: fsQueryError } = await supabaseAdmin
      .from('fiche_services')
      .select('fiche_id')
      .in('service_id', targetIds);
    if (fsQueryError) throw fsQueryError;

    const ficheIds = [...new Set((ficheServicesData ?? []).map((fs: { fiche_id: string }) => fs.fiche_id))];

    if (ficheIds.length > 0) {
      const { error: fsDeleteError } = await supabaseAdmin
        .from('fiche_services')
        .delete()
        .in('fiche_id', ficheIds);
      if (fsDeleteError) throw fsDeleteError;

      const { error: fichesError } = await supabaseAdmin
        .from('fiches')
        .delete()
        .in('id', ficheIds)
        .eq('salon_id', profile.salon_id);
      if (fichesError) throw fichesError;
    }

    const { error: dbError } = await supabaseAdmin
      .from('services')
      .delete()
      .in('id', targetIds)
      .eq('salon_id', profile.salon_id);
    if (dbError) throw dbError;

    if (targetIds.length === 1) {
      const name = (servicesToDelete?.[0] as { name?: string } | undefined)?.name;
      await logActivity({
        salonId: profile.salon_id,
        actorId: profile.id,
        entityType: 'services',
        entityId: targetIds[0],
        action: 'delete',
        summary: name ? `ha eliminato il servizio ${name}` : 'ha eliminato un servizio',
      });
    } else {
      await logActivity({
        salonId: profile.salon_id,
        actorId: profile.id,
        entityType: 'services',
        action: 'bulk',
        changes: { ids: targetIds },
        summary: `ha eliminato ${targetIds.length} servizi`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting service:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
