import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe/client';
import { STRIPE_YEARLY_PRICE_ID } from '@/lib/stripe/config';
import { canManageSalon } from '@/lib/auth/roles';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type PortalFlow = 'switch-to-yearly';

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
      return NextResponse.json({ error: 'Solo il proprietario può gestire l\'abbonamento.' }, { status: 403 });
    }

    const { data: salon } = await supabaseAdmin
      .from('salons')
      .select('stripe_customer_id, stripe_subscription_id, subscription_status')
      .eq('id', profile.salon_id)
      .single();

    if (!salon?.stripe_customer_id) {
      return NextResponse.json({ error: 'Nessun abbonamento attivo.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const flow = body?.flow as PortalFlow | undefined;

    const origin = process.env.NEXT_PUBLIC_APP_URL || '';
    const stripe = getStripe();

    const params: Stripe.BillingPortal.SessionCreateParams = {
      customer: salon.stripe_customer_id,
      return_url: `${origin}/admin/subscribe`,
    };

    if (flow === 'switch-to-yearly') {
      if (!salon.stripe_subscription_id) {
        return NextResponse.json({ error: 'Nessun abbonamento attivo.' }, { status: 400 });
      }
      if (!['active', 'trialing'].includes(salon.subscription_status ?? '')) {
        return NextResponse.json(
          { error: 'L\'abbonamento deve essere attivo per cambiare piano.' },
          { status: 400 }
        );
      }

      const subscription = await stripe.subscriptions.retrieve(salon.stripe_subscription_id);
      const item = subscription.items.data[0];
      if (!item) {
        return NextResponse.json({ error: 'Abbonamento non valido.' }, { status: 400 });
      }
      if (item.price.recurring?.interval === 'year') {
        return NextResponse.json({ error: 'Sei già sul piano annuale.' }, { status: 400 });
      }

      params.flow_data = {
        type: 'subscription_update_confirm',
        subscription_update_confirm: {
          subscription: salon.stripe_subscription_id,
          items: [{ id: item.id, price: STRIPE_YEARLY_PRICE_ID, quantity: 1 }],
        },
        after_completion: {
          type: 'redirect',
          redirect: { return_url: `${origin}/admin/subscribe` },
        },
      };
    }

    const session = await stripe.billingPortal.sessions.create(params);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: 'Errore durante l\'apertura del portale.' }, { status: 500 });
  }
}
