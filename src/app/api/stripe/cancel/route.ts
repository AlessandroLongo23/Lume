import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe/client';
import { canManageSalon } from '@/lib/auth/roles';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const VALID_REASONS = new Set([
  'too_expensive',
  'missing_features',
  'closing_salon',
  'switched_tool',
  'other',
]);

// Maps internal reason codes to Stripe's `cancellation_details.feedback` enum.
// Stripe's set is fixed; our enum is shaped for our retention reporting.
function toStripeFeedback(reason: string | null): 'too_expensive' | 'missing_features' | 'switched_service' | 'unused' | 'other' | null {
  switch (reason) {
    case 'too_expensive':    return 'too_expensive';
    case 'missing_features': return 'missing_features';
    case 'switched_tool':    return 'switched_service';
    case 'closing_salon':    return 'unused';
    case 'other':            return 'other';
    default:                 return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('salon_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || !canManageSalon(profile.role)) {
      return NextResponse.json({ error: 'Solo il proprietario può annullare l\'abbonamento.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const reasonRaw = typeof body?.reason === 'string' ? body.reason : null;
    const reason = reasonRaw && VALID_REASONS.has(reasonRaw) ? reasonRaw : null;
    const comment = typeof body?.comment === 'string' && body.comment.trim().length > 0
      ? body.comment.trim().slice(0, 1000)
      : null;

    const { data: salon } = await supabaseAdmin
      .from('salons')
      .select('stripe_subscription_id')
      .eq('id', profile.salon_id)
      .single();

    if (!salon?.stripe_subscription_id) {
      return NextResponse.json({ error: 'Nessun abbonamento attivo da annullare.' }, { status: 400 });
    }

    const stripeFeedback = toStripeFeedback(reason);
    const subscription = await getStripe().subscriptions.update(salon.stripe_subscription_id, {
      cancel_at_period_end: true,
      cancellation_details: {
        ...(stripeFeedback ? { feedback: stripeFeedback } : {}),
        ...(comment ? { comment } : {}),
      },
    });

    const cancelAt = subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000).toISOString()
      : null;

    await supabaseAdmin
      .from('subscription_cancellations')
      .insert({
        salon_id: profile.salon_id,
        reason,
        comment,
        cancel_at: cancelAt,
      });

    return NextResponse.json({ ok: true, cancelAt });
  } catch (error) {
    console.error('Cancel error:', error);
    return NextResponse.json({ error: 'Errore durante l\'annullamento dell\'abbonamento.' }, { status: 500 });
  }
}
