import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';
import { canManageSalon } from '@/lib/auth/roles';
import { pickAllowed } from '@/lib/utils/pickAllowed';

const PRODUCT_WRITE_FIELDS = [
  'name', 'manufacturer_id', 'supplier_id', 'product_category_id',
  'price', 'sell_price', 'is_for_retail', 'stock_quantity', 'min_threshold',
  'quantity_ml', 'description', 'imageUrl',
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

    const { product } = await request.json();
    const supabaseAdmin = getAdminClient();

    const { data, error: dbError } = await supabaseAdmin
      .from('products')
      .insert({ ...pickAllowed(product, PRODUCT_WRITE_FIELDS), salon_id: profile.salon_id })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, product: data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating product:', error);
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

    const { id, action, product, delta, ids, patch } = await request.json();
    const supabaseAdmin = getAdminClient();

    if (action === 'bulk-update') {
      if (!Array.isArray(ids) || ids.length === 0 || !patch)
        return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
      const { error: dbError } = await supabaseAdmin
        .from('products')
        .update(pickAllowed(patch, PRODUCT_WRITE_FIELDS))
        .in('id', ids)
        .eq('salon_id', profile.salon_id);
      if (dbError) throw dbError;
      return NextResponse.json({ success: true });
    }

    if (action === 'bulk-archive' || action === 'bulk-restore') {
      if (!Array.isArray(ids) || ids.length === 0)
        return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
      const archived_at = action === 'bulk-archive' ? new Date().toISOString() : null;
      const { error: dbError } = await supabaseAdmin
        .from('products')
        .update({ archived_at })
        .in('id', ids)
        .eq('salon_id', profile.salon_id);
      if (dbError) throw dbError;
      return NextResponse.json({ success: true });
    }

    if (action === 'adjust-stock') {
      if (!id || typeof delta !== 'number' || !Number.isInteger(delta) || delta === 0) {
        return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
      }
      const { error: dbError } = await supabaseAdmin.rpc('adjust_product_stock', {
        p_id: id,
        p_salon_id: profile.salon_id,
        p_delta: delta,
      });
      if (dbError) throw dbError;
      return NextResponse.json({ success: true });
    }

    if (action === 'archive' || action === 'restore') {
      if (!id) {
        return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
      }
      const archived_at = action === 'archive' ? new Date().toISOString() : null;
      const { error: dbError } = await supabaseAdmin
        .from('products')
        .update({ archived_at })
        .eq('id', id)
        .eq('salon_id', profile.salon_id);
      if (dbError) throw dbError;
      return NextResponse.json({ success: true });
    }

    if (!id || !product) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }
    const { data, error: dbError } = await supabaseAdmin
      .from('products')
      .update(pickAllowed(product, PRODUCT_WRITE_FIELDS))
      .eq('id', id)
      .eq('salon_id', profile.salon_id)
      .select()
      .single();
    if (dbError) throw dbError;
    return NextResponse.json({ success: true, product: data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating/archiving product:', msg);
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
    const supabaseAdmin = getAdminClient();

    if (Array.isArray(ids) && ids.length > 0) {
      const { error: dbError } = await supabaseAdmin
        .from('products')
        .delete()
        .in('id', ids)
        .eq('salon_id', profile.salon_id);
      if (dbError) throw dbError;
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    const { error: dbError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id)
      .eq('salon_id', profile.salon_id);
    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting product:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
