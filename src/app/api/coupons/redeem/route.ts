import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });

    const admin = getAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('id, salon_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'owner' && profile.role !== 'operator')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { coupon_id, fiche_id, amount_applied } = await request.json() as {
      coupon_id: string; fiche_id: string; amount_applied: number;
    };
    if (!coupon_id || !fiche_id || typeof amount_applied !== 'number' || amount_applied < 0) {
      return NextResponse.json({ success: false, error: 'Payload non valido' }, { status: 400 });
    }

    // Load coupon, ensure same salon and currently usable
    const { data: coupon, error: couponErr } = await admin
      .from('coupons')
      .select('*')
      .eq('id', coupon_id)
      .eq('salon_id', profile.salon_id)
      .single();
    if (couponErr || !coupon) {
      return NextResponse.json({ success: false, error: 'Coupon non trovato' }, { status: 404 });
    }
    if (!coupon.is_active) {
      return NextResponse.json({ success: false, error: 'Coupon disattivato' }, { status: 400 });
    }
    const now = Date.now();
    if (new Date(coupon.valid_until).getTime() < now) {
      return NextResponse.json({ success: false, error: 'Coupon scaduto' }, { status: 400 });
    }
    if (new Date(coupon.valid_from).getTime() > now) {
      return NextResponse.json({ success: false, error: 'Coupon non ancora valido' }, { status: 400 });
    }

    // For gift cards, decrement balance and disallow over-spend
    let remainingAfter: number | null = null;
    if (coupon.kind === 'gift_card') {
      const before: number = Number(coupon.remaining_value ?? 0);
      if (amount_applied > before + 0.0001) {
        return NextResponse.json({ success: false, error: 'Importo superiore al saldo' }, { status: 400 });
      }
      remainingAfter = Math.max(0, Number((before - amount_applied).toFixed(2)));
      const { error: balErr } = await admin
        .from('coupons')
        .update({ remaining_value: remainingAfter })
        .eq('id', coupon_id)
        .eq('salon_id', profile.salon_id);
      if (balErr) throw balErr;
    }

    const { data: redemption, error: redErr } = await admin
      .from('coupon_redemptions')
      .insert({
        coupon_id,
        fiche_id,
        salon_id: profile.salon_id,
        amount_applied,
        remaining_after: remainingAfter,
        applied_by: profile.id,
      })
      .select()
      .single();

    if (redErr) {
      // Best-effort rollback of the balance decrement
      if (coupon.kind === 'gift_card') {
        await admin
          .from('coupons')
          .update({ remaining_value: coupon.remaining_value })
          .eq('id', coupon_id);
      }
      throw redErr;
    }

    // Re-read the coupon so the client store sees the new remaining_value
    const { data: updatedCoupon } = await admin
      .from('coupons')
      .select('*')
      .eq('id', coupon_id)
      .single();

    return NextResponse.json({ success: true, redemption, coupon: updatedCoupon });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error redeeming coupon:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
