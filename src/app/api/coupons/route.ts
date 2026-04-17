import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function getCallerProfile(supabase: Awaited<ReturnType<typeof createServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, salon_id, role')
    .eq('id', user.id)
    .single();
  return profile;
}

type IncomingCoupon = {
  kind: 'gift' | 'gift_card';
  recipient_client_id: string;
  purchaser_client_id?: string | null;
  discount_type: 'fixed' | 'percent' | 'free_item';
  discount_value?: number | null;
  free_item_kind?: 'service' | 'product' | null;
  free_item_id?: string | null;
  original_value?: number | null;
  valid_from?: string | null;
  valid_until: string;
  scope_service_ids?: string[] | null;
  scope_product_ids?: string[] | null;
  scope_service_category_ids?: string[] | null;
  scope_product_category_ids?: string[] | null;
  sale_amount?: number | null;
  sale_payment_method?: 'cash' | 'card' | 'transfer' | null;
  notes?: string | null;
};

function validatePayload(c: Partial<IncomingCoupon>): string | null {
  if (!c.kind || !['gift', 'gift_card'].includes(c.kind)) return 'kind non valido';
  if (!c.recipient_client_id) return 'Destinatario mancante';
  if (!c.discount_type || !['fixed', 'percent', 'free_item'].includes(c.discount_type)) {
    return 'discount_type non valido';
  }
  if (!c.valid_until) return 'Data di scadenza mancante';

  if (c.kind === 'gift_card') {
    if (!c.purchaser_client_id) return 'Acquirente mancante';
    if (c.original_value == null || c.original_value <= 0) return 'Valore della gift card non valido';
    if (c.sale_amount == null) return 'Importo incassato mancante';
    if (!c.sale_payment_method) return 'Metodo di pagamento mancante';
  }
  if (c.discount_type === 'fixed' && (c.discount_value == null || c.discount_value <= 0)) {
    return 'Valore dello sconto non valido';
  }
  if (c.discount_type === 'percent' && (c.discount_value == null || c.discount_value <= 0 || c.discount_value > 100)) {
    return 'Percentuale di sconto non valida (1–100)';
  }
  if (c.discount_type === 'free_item' && (!c.free_item_kind || !c.free_item_id)) {
    return 'Selezionare il servizio o prodotto omaggio';
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);
    if (!profile || (profile.role !== 'owner' && profile.role !== 'operator')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { coupon } = await request.json() as { coupon: Partial<IncomingCoupon> };
    const validationError = validatePayload(coupon);
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    const admin = getAdminClient();

    const original = coupon.kind === 'gift_card' ? coupon.original_value! : null;

    const insertRow = {
      salon_id: profile.salon_id,
      kind: coupon.kind!,
      recipient_client_id: coupon.recipient_client_id!,
      purchaser_client_id: coupon.purchaser_client_id ?? null,
      discount_type: coupon.discount_type!,
      discount_value: coupon.discount_value ?? null,
      free_item_kind: coupon.free_item_kind ?? null,
      free_item_id: coupon.free_item_id ?? null,
      original_value: original,
      remaining_value: original,
      valid_from: coupon.valid_from ?? new Date().toISOString(),
      valid_until: coupon.valid_until!,
      scope_service_ids: coupon.scope_service_ids?.length ? coupon.scope_service_ids : null,
      scope_product_ids: coupon.scope_product_ids?.length ? coupon.scope_product_ids : null,
      scope_service_category_ids: coupon.scope_service_category_ids?.length
        ? coupon.scope_service_category_ids
        : null,
      scope_product_category_ids: coupon.scope_product_category_ids?.length
        ? coupon.scope_product_category_ids
        : null,
      sale_amount: coupon.sale_amount ?? null,
      sale_payment_method: coupon.sale_payment_method ?? null,
      notes: coupon.notes ?? null,
      is_active: true,
      created_by: profile.id,
    };

    const { data, error } = await admin
      .from('coupons')
      .insert(insertRow)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, coupon: data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating coupon:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);
    if (!profile || (profile.role !== 'owner' && profile.role !== 'operator')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id, coupon } = await request.json() as { id: string; coupon: Partial<IncomingCoupon> & { is_active?: boolean } };
    if (!id) return NextResponse.json({ success: false, error: 'id mancante' }, { status: 400 });

    const admin = getAdminClient();
    // Operators can only flip is_active or update notes; structural changes are owner-only
    const updates: Record<string, unknown> = {};
    if (typeof coupon.is_active === 'boolean') updates.is_active = coupon.is_active;
    if (coupon.notes !== undefined) updates.notes = coupon.notes;
    if (profile.role === 'owner') {
      // Owner may also adjust scope/validity/etc.
      const allowed = [
        'valid_from', 'valid_until',
        'scope_service_ids', 'scope_product_ids',
        'scope_service_category_ids', 'scope_product_category_ids',
        'discount_value',
      ] as const;
      for (const k of allowed) {
        if ((coupon as Record<string, unknown>)[k] !== undefined) {
          updates[k] = (coupon as Record<string, unknown>)[k];
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'Nessun campo da aggiornare' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('coupons')
      .update(updates)
      .eq('id', id)
      .eq('salon_id', profile.salon_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, coupon: data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating coupon:', error);
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

    const { id } = await request.json() as { id: string };
    if (!id) return NextResponse.json({ success: false, error: 'id mancante' }, { status: 400 });

    const admin = getAdminClient();
    const { error } = await admin
      .from('coupons')
      .delete()
      .eq('id', id)
      .eq('salon_id', profile.salon_id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
