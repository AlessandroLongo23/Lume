import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe/client';
import { STRIPE_MONTHLY_PRICE_ID, STRIPE_YEARLY_PRICE_ID } from '@/lib/stripe/config';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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

    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ error: 'Solo il proprietario può gestire l\'abbonamento.' }, { status: 403 });
    }

    const { plan } = await request.json();

    const priceId = plan === 'monthly' ? STRIPE_MONTHLY_PRICE_ID : plan === 'yearly' ? STRIPE_YEARLY_PRICE_ID : null;
    if (!priceId) {
      return NextResponse.json({ error: 'Piano non valido.' }, { status: 400 });
    }

    const { data: salon } = await supabaseAdmin
      .from('salons')
      .select('id, stripe_customer_id, name')
      .eq('id', profile.salon_id)
      .single();

    if (!salon) {
      return NextResponse.json({ error: 'Salone non trovato.' }, { status: 404 });
    }

    // Create or reuse Stripe Customer
    let customerId = salon.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: salon.name,
        metadata: { salon_id: salon.id },
      });
      customerId = customer.id;

      await supabaseAdmin
        .from('salons')
        .update({ stripe_customer_id: customerId })
        .eq('id', salon.id);
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || '';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/admin/subscribe?success=true`,
      cancel_url: `${origin}/admin/subscribe`,
      metadata: { salon_id: salon.id },
      subscription_data: {
        metadata: { salon_id: salon.id },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Errore durante la creazione del checkout.' }, { status: 500 });
  }
}
