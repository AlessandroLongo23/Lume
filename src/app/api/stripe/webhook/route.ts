import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe/client';
import Stripe from 'stripe';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function derivePlan(subscription: Stripe.Subscription): 'monthly' | 'yearly' | null {
  const item = subscription.items.data[0];
  if (!item) return null;
  const interval = item.price.recurring?.interval;
  if (interval === 'month') return 'monthly';
  if (interval === 'year') return 'yearly';
  return null;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const salonId = session.metadata?.salon_id;
  if (!salonId || !session.subscription || !session.customer) return;

  const supabaseAdmin = getAdminClient();
  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription.id;
  const customerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer.id;

  // Retrieve full subscription to get status and period end
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const plan = derivePlan(subscription);
  const periodEnd = subscription.items.data[0]?.current_period_end;

  await supabaseAdmin
    .from('salons')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: 'active',
      subscription_plan: plan,
      subscription_ends_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    })
    .eq('id', salonId);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const salonId = subscription.metadata?.salon_id;
  const supabaseAdmin = getAdminClient();

  // Find salon by subscription ID if no metadata
  let targetSalonId = salonId;
  if (!targetSalonId) {
    const { data } = await supabaseAdmin
      .from('salons')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    targetSalonId = data?.id;
  }
  if (!targetSalonId) return;

  const plan = derivePlan(subscription);
  const periodEnd = subscription.items.data[0]?.current_period_end;

  await supabaseAdmin
    .from('salons')
    .update({
      subscription_status: subscription.status === 'active' ? 'active' : subscription.status,
      subscription_plan: plan,
      subscription_ends_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    })
    .eq('id', targetSalonId);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabaseAdmin = getAdminClient();

  await supabaseAdmin
    .from('salons')
    .update({
      subscription_status: 'canceled',
      subscription_ends_at: null,
      stripe_subscription_id: null,
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Only process the very first subscription payment (referral trigger)
  if (invoice.billing_reason !== 'subscription_create') return;

  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;
  if (!customerId) return;

  const supabaseAdmin = getAdminClient();

  // Find the salon that just paid
  const { data: paidSalon } = await supabaseAdmin
    .from('salons')
    .select('id, referred_by_salon_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!paidSalon?.referred_by_salon_id) return;

  // Find the pending referral credit
  const { data: credit } = await supabaseAdmin
    .from('referral_credits')
    .select('id')
    .eq('referrer_salon_id', paidSalon.referred_by_salon_id)
    .eq('referred_salon_id', paidSalon.id)
    .eq('status', 'pending')
    .single();

  if (!credit) return;

  // Check cap: referrer must have fewer than 6 earned/applied credits
  const { count } = await supabaseAdmin
    .from('referral_credits')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_salon_id', paidSalon.referred_by_salon_id)
    .in('status', ['earned', 'applied']);

  if ((count ?? 0) >= 6) {
    // Cap reached — mark as earned but don't apply monetary credit
    await supabaseAdmin
      .from('referral_credits')
      .update({ status: 'earned', earned_at: new Date().toISOString() })
      .eq('id', credit.id);
    return;
  }

  // Get the referrer salon's Stripe customer ID
  const { data: referrerSalon } = await supabaseAdmin
    .from('salons')
    .select('stripe_customer_id')
    .eq('id', paidSalon.referred_by_salon_id)
    .single();

  if (referrerSalon?.stripe_customer_id) {
    // Apply credit immediately via Stripe Customer Balance
    await getStripe().customers.createBalanceTransaction(referrerSalon.stripe_customer_id, {
      amount: -4990, // -€49.90 credit
      currency: 'eur',
      description: 'Credito referral Lume - 1 mese gratuito',
    });

    await supabaseAdmin
      .from('referral_credits')
      .update({
        status: 'applied',
        earned_at: new Date().toISOString(),
        applied_at: new Date().toISOString(),
      })
      .eq('id', credit.id);
  } else {
    // Referrer hasn't subscribed yet — mark earned, apply later
    await supabaseAdmin
      .from('referral_credits')
      .update({ status: 'earned', earned_at: new Date().toISOString() })
      .eq('id', credit.id);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;
  if (!customerId) return;

  const supabaseAdmin = getAdminClient();
  await supabaseAdmin
    .from('salons')
    .update({ subscription_status: 'past_due' })
    .eq('stripe_customer_id', customerId);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }
  } catch (error) {
    console.error(`Webhook handler error for ${event.type}:`, error);
    // Still return 200 to prevent Stripe from retrying on app-level errors
  }

  return new Response('ok', { status: 200 });
}
