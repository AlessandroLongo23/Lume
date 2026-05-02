import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';
import { canManageSalon } from '@/lib/auth/roles';

const ENTITIES = [
  'clients',
  'operators',
  'services',
  'products',
  'orders',
  'fiches',
  'coupons',
  'abbonamenti',
] as const;

type Entity = typeof ENTITIES[number];

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type Admin = ReturnType<typeof getAdminClient>;

/**
 * Cascade strategies per entity, derived from the FK graph in public.*.
 * Tables with ON DELETE CASCADE / SET NULL are handled by Postgres; any
 * NO ACTION FK pointing at the entity must be cleared manually first.
 */
async function deleteAllForEntity(admin: Admin, entity: Entity, salonId: string): Promise<void> {
  switch (entity) {
    case 'clients': {
      // fiches.client_id is NO ACTION; fiche_services.fiche_id is NO ACTION too.
      // Clear from the leaves up, then delete clients (which CASCADEs to
      // abbonamenti and recipient coupons; nulls purchaser coupons).
      const { data: clientFiches, error: fichesLookupError } = await admin
        .from('fiches')
        .select('id')
        .eq('salon_id', salonId);
      if (fichesLookupError) throw fichesLookupError;

      const ficheIds = (clientFiches ?? []).map((f: { id: string }) => f.id);
      if (ficheIds.length > 0) {
        const { error } = await admin.from('fiche_services').delete().in('fiche_id', ficheIds);
        if (error) throw error;
      }

      const { error: fichesError } = await admin.from('fiches').delete().eq('salon_id', salonId);
      if (fichesError) throw fichesError;

      const { error: clientsError } = await admin.from('clients').delete().eq('salon_id', salonId);
      if (clientsError) throw clientsError;
      return;
    }

    case 'operators': {
      // fiche_services.operator_id NO ACTION → null it; orders.supplier_id
      // NO ACTION → null it. operator_unavailabilities CASCADEs.
      const { data: ops, error: opsLookupError } = await admin
        .from('operators')
        .select('id')
        .eq('salon_id', salonId);
      if (opsLookupError) throw opsLookupError;

      const opIds = (ops ?? []).map((o: { id: string }) => o.id);
      if (opIds.length > 0) {
        const { error: fsError } = await admin
          .from('fiche_services')
          .update({ operator_id: null })
          .in('operator_id', opIds);
        if (fsError) throw fsError;

        const { error: ordError } = await admin
          .from('orders')
          .update({ supplier_id: null })
          .in('supplier_id', opIds);
        if (ordError) throw ordError;
      }

      const { error } = await admin.from('operators').delete().eq('salon_id', salonId);
      if (error) throw error;
      return;
    }

    case 'services': {
      // fiche_services.service_id NO ACTION; service_products.service_id NO ACTION.
      // service_price_history CASCADEs.
      const { data: svcs, error: svcsLookupError } = await admin
        .from('services')
        .select('id')
        .eq('salon_id', salonId);
      if (svcsLookupError) throw svcsLookupError;

      const svcIds = (svcs ?? []).map((s: { id: string }) => s.id);
      if (svcIds.length > 0) {
        const { error: fsError } = await admin
          .from('fiche_services')
          .delete()
          .in('service_id', svcIds);
        if (fsError) throw fsError;

        const { error: spError } = await admin
          .from('service_products')
          .delete()
          .in('service_id', svcIds);
        if (spError) throw spError;
      }

      const { error } = await admin.from('services').delete().eq('salon_id', salonId);
      if (error) throw error;
      return;
    }

    case 'products': {
      // fiche_products, order_products, service_products all NO ACTION.
      // product_price_history CASCADEs.
      const { data: prods, error: prodsLookupError } = await admin
        .from('products')
        .select('id')
        .eq('salon_id', salonId);
      if (prodsLookupError) throw prodsLookupError;

      const prodIds = (prods ?? []).map((p: { id: string }) => p.id);
      if (prodIds.length > 0) {
        const { error: fpError } = await admin
          .from('fiche_products')
          .delete()
          .in('product_id', prodIds);
        if (fpError) throw fpError;

        const { error: opError } = await admin
          .from('order_products')
          .delete()
          .in('product_id', prodIds);
        if (opError) throw opError;

        const { error: spError } = await admin
          .from('service_products')
          .delete()
          .in('product_id', prodIds);
        if (spError) throw spError;
      }

      const { error } = await admin.from('products').delete().eq('salon_id', salonId);
      if (error) throw error;
      return;
    }

    case 'orders': {
      // order_products.order_id NO ACTION.
      const { data: ords, error: ordsLookupError } = await admin
        .from('orders')
        .select('id')
        .eq('salon_id', salonId);
      if (ordsLookupError) throw ordsLookupError;

      const ordIds = (ords ?? []).map((o: { id: string }) => o.id);
      if (ordIds.length > 0) {
        const { error: opError } = await admin
          .from('order_products')
          .delete()
          .in('order_id', ordIds);
        if (opError) throw opError;
      }

      const { error } = await admin.from('orders').delete().eq('salon_id', salonId);
      if (error) throw error;
      return;
    }

    case 'fiches': {
      // fiche_services.fiche_id NO ACTION; payments/products/redemptions CASCADE.
      const { data: fs, error: fsLookupError } = await admin
        .from('fiches')
        .select('id')
        .eq('salon_id', salonId);
      if (fsLookupError) throw fsLookupError;

      const ficheIds = (fs ?? []).map((f: { id: string }) => f.id);
      if (ficheIds.length > 0) {
        const { error } = await admin
          .from('fiche_services')
          .delete()
          .in('fiche_id', ficheIds);
        if (error) throw error;
      }

      const { error } = await admin.from('fiches').delete().eq('salon_id', salonId);
      if (error) throw error;
      return;
    }

    case 'coupons': {
      // coupon_redemptions CASCADEs.
      const { error } = await admin.from('coupons').delete().eq('salon_id', salonId);
      if (error) throw error;
      return;
    }

    case 'abbonamenti': {
      // fiche_services.abbonamento_id SET NULL is handled by FK.
      const { error } = await admin.from('abbonamenti').delete().eq('salon_id', salonId);
      if (error) throw error;
      return;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || !canManageSalon(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { entity } = await request.json();
    if (!entity || !ENTITIES.includes(entity)) {
      return NextResponse.json({ success: false, error: 'Invalid entity' }, { status: 400 });
    }

    const admin = getAdminClient();
    await deleteAllForEntity(admin, entity, profile.salon_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting all:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
