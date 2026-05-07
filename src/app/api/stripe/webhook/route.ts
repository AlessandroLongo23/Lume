import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { addMonths } from 'date-fns';
import { getStripe } from '@/lib/stripe/client';
import Stripe from 'stripe';

const REFERRAL_CAP = 6;

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

// Pushes the referrer's subscription trial_end forward by one month per credit.
// Replaces the previous Stripe customer-balance approach: now the renewal date
// itself shifts, so the UI ("Prossimo addebito") reflects the reward directly.
//
// Concurrency note: when two referred salons make their first payment within
// the same window, both webhooks read the same current_period_end from Stripe
// and one extension can be lost. Acceptable for v1 (cap is 6 per referrer);
// rare event, recoverable from referral_credits audit trail.
async function applyReferralExtension(
  supabaseAdmin: SupabaseClient,
  referrerSalonId: string,
  creditId: string
): Promise<void> {
  const { data: referrerSalon } = await supabaseAdmin
    .from('salons')
    .select('stripe_subscription_id')
    .eq('id', referrerSalonId)
    .single();

  // Referrer hasn't subscribed yet — mark earned, retroactively applied
  // when they make their own first payment (handled in handleInvoicePaymentSucceeded).
  if (!referrerSalon?.stripe_subscription_id) {
    await supabaseAdmin
      .from('referral_credits')
      .update({ status: 'earned', earned_at: new Date().toISOString() })
      .eq('id', creditId);
    return;
  }

  const subscription = await getStripe().subscriptions.retrieve(referrerSalon.stripe_subscription_id);

  // Skip if subscription is canceling at period end — would feel punitive to
  // auto-extend something the user has already chosen to end.
  if (subscription.cancel_at_period_end) {
    await supabaseAdmin
      .from('referral_credits')
      .update({ status: 'earned', earned_at: new Date().toISOString() })
      .eq('id', creditId);
    return;
  }

  const periodEndSec = subscription.items.data[0]?.current_period_end;
  if (!periodEndSec) return;

  const previousPeriodEnd = new Date(periodEndSec * 1000);
  const baseDate = previousPeriodEnd.getTime() > Date.now() ? previousPeriodEnd : new Date();
  const newPeriodEnd = addMonths(baseDate, 1);
  const newTrialEndSec = Math.floor(newPeriodEnd.getTime() / 1000);

  await getStripe().subscriptions.update(subscription.id, {
    trial_end: newTrialEndSec,
    proration_behavior: 'none',
  });

  const nowIso = new Date().toISOString();
  await supabaseAdmin
    .from('referral_credits')
    .update({
      status: 'applied',
      earned_at: nowIso,
      applied_at: nowIso,
      previous_period_end: previousPeriodEnd.toISOString(),
      new_period_end: newPeriodEnd.toISOString(),
    })
    .eq('id', creditId);

  await supabaseAdmin
    .from('salons')
    .update({ referral_extension_until: newPeriodEnd.toISOString() })
    .eq('id', referrerSalonId);
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

  if (!paidSalon) return;

  // (1) Forward credit: this salon was referred — reward the referrer.
  if (paidSalon.referred_by_salon_id) {
    const { data: credit } = await supabaseAdmin
      .from('referral_credits')
      .select('id')
      .eq('referrer_salon_id', paidSalon.referred_by_salon_id)
      .eq('referred_salon_id', paidSalon.id)
      .eq('status', 'pending')
      .single();

    if (credit) {
      const { count } = await supabaseAdmin
        .from('referral_credits')
        .select('id', { count: 'exact', head: true })
        .eq('referrer_salon_id', paidSalon.referred_by_salon_id)
        .in('status', ['earned', 'applied']);

      if ((count ?? 0) >= REFERRAL_CAP) {
        await supabaseAdmin
          .from('referral_credits')
          .update({ status: 'earned', earned_at: new Date().toISOString() })
          .eq('id', credit.id);
      } else {
        await applyReferralExtension(supabaseAdmin, paidSalon.referred_by_salon_id, credit.id);
      }
    }
  }

  // (2) Backward credit: this salon may have referred others before subscribing.
  // Apply any of their own 'earned' credits now that they have an active sub.
  const { data: ownEarnedCredits } = await supabaseAdmin
    .from('referral_credits')
    .select('id')
    .eq('referrer_salon_id', paidSalon.id)
    .eq('status', 'earned');

  for (const credit of ownEarnedCredits ?? []) {
    const { count } = await supabaseAdmin
      .from('referral_credits')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_salon_id', paidSalon.id)
      .eq('status', 'applied');

    if ((count ?? 0) >= REFERRAL_CAP) break;

    await applyReferralExtension(supabaseAdmin, paidSalon.id, credit.id);
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
