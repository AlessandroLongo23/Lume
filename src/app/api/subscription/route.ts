import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { getActiveSalonId } from '@/lib/utils/getActiveSalonId';
import { normalizeProfileRole } from '@/lib/auth/roles';
import { getStripe } from '@/lib/stripe/client';
import type Stripe from 'stripe';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('salon_id, role, first_name, last_name, email')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 });
    }

    const effectiveRole = normalizeProfileRole(profile);
    const isAdmin = effectiveRole === 'admin';

    // Prefer the cookie-selected salon (multi-salon owners), fall back to profile default
    const salonId = await getActiveSalonId(profile.salon_id, isAdmin);

    const { data: salon } = await supabaseAdmin
      .from('salons')
      .select('name, trial_ends_at, subscription_status, subscription_plan, subscription_ends_at, referral_code, referral_extension_until, logo_url, stripe_customer_id, stripe_subscription_id')
      .eq('id', salonId)
      .single();

    if (!salon) {
      return NextResponse.json({ error: 'Salone non trovato' }, { status: 404 });
    }

    // Stripe-side details: payment method on file, scheduled cancel date, next charge amount.
    // Failures here must not break the page — fall back to nulls and log.
    let paymentMethod: { brand: string; last4: string } | null = null;
    let cancelAt: string | null = null;
    let nextChargeAmount: number | null = null;

    if (salon.stripe_subscription_id) {
      try {
        const subscription = await getStripe().subscriptions.retrieve(salon.stripe_subscription_id, {
          expand: ['default_payment_method'],
        });

        if (subscription.cancel_at) {
          cancelAt = new Date(subscription.cancel_at * 1000).toISOString();
        }

        const pm = subscription.default_payment_method as Stripe.PaymentMethod | string | null;
        if (pm && typeof pm !== 'string' && pm.card) {
          paymentMethod = { brand: pm.card.brand, last4: pm.card.last4 };
        }

        const item = subscription.items?.data?.[0];
        if (item?.price?.unit_amount != null) {
          nextChargeAmount = item.price.unit_amount / 100;
        }
      } catch (e) {
        console.error('Stripe subscription fetch failed:', e);
      }

      if (!paymentMethod && salon.stripe_customer_id) {
        try {
          const customer = await getStripe().customers.retrieve(salon.stripe_customer_id, {
            expand: ['invoice_settings.default_payment_method'],
          });
          if (customer && !customer.deleted) {
            const pm = customer.invoice_settings?.default_payment_method as Stripe.PaymentMethod | string | null;
            if (pm && typeof pm !== 'string' && pm.card) {
              paymentMethod = { brand: pm.card.brand, last4: pm.card.last4 };
            }
          }
        } catch (e) {
          console.error('Stripe customer fetch failed:', e);
        }
      }
    }

    // Fetch referrals with the referred salon name
    const { data: referralRows } = await supabaseAdmin
      .from('referral_credits')
      .select('id, status, created_at, earned_at, applied_at, new_period_end, referred_salon:referred_salon_id(name)')
      .eq('referrer_salon_id', salonId)
      .order('created_at', { ascending: false });

    type ReferralRow = {
      id: string;
      status: 'pending' | 'earned' | 'applied';
      created_at: string;
      earned_at: string | null;
      applied_at: string | null;
      new_period_end: string | null;
      referred_salon: { name: string } | { name: string }[] | null;
    };

    const referrals = ((referralRows ?? []) as unknown as ReferralRow[]).map((r) => {
      const salon = Array.isArray(r.referred_salon) ? r.referred_salon[0] : r.referred_salon;
      return {
        id:            r.id,
        salonName:     salon?.name ?? 'Salone',
        status:        r.status,
        createdAt:     r.created_at,
        earnedAt:      r.earned_at,
        appliedAt:     r.applied_at,
        newPeriodEnd:  r.new_period_end,
      };
    });

    const pendingCredits = referrals.filter((r) => r.status === 'pending').length;
    const earnedCredits  = referrals.filter((r) => r.status === 'earned' || r.status === 'applied').length;

    const now = new Date();
    const trialEnd = new Date(salon.trial_ends_at);
    const trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // A subscription enters Stripe `trialing` status while a referral credit
    // is active. Distinguish from the original signup trial so the UI shows
    // "credit applied" rather than "trial expiring."
    const referralExtensionUntil = salon.referral_extension_until;
    const isOnReferralCredit =
      salon.subscription_status === 'trialing' &&
      !!referralExtensionUntil &&
      new Date(referralExtensionUntil).getTime() > now.getTime();

    const isActive = salon.subscription_status === 'active' || isOnReferralCredit;
    const isTrialing = salon.subscription_status === 'trialing' && trialDaysLeft > 0 && !isOnReferralCredit;
    const isExpired = !isActive && !isTrialing;
    const showTrialWarning = isTrialing && trialDaysLeft <= 7;

    // Plan switching is currently one-way: monthly → yearly.
    // Only offered for actively-paying subs (not past_due / canceled).
    const availablePlanChange: 'upgrade-yearly' | null =
      (salon.subscription_status === 'active' || isOnReferralCredit) &&
      salon.subscription_plan === 'monthly'
        ? 'upgrade-yearly'
        : null;

    return NextResponse.json({
      isTrialing,
      isActive,
      isExpired,
      trialDaysLeft,
      trialEndsAt: salon.trial_ends_at,
      showTrialWarning,
      subscriptionStatus: salon.subscription_status,
      subscriptionPlan: salon.subscription_plan,
      subscriptionEndsAt: salon.subscription_ends_at,
      cancelAt,
      paymentMethod,
      nextChargeAmount,
      referralCode: salon.referral_code,
      pendingCredits,
      earnedCredits,
      referralExtensionUntil,
      isOnReferralCredit,
      availablePlanChange,
      referrals,
      salonName: salon.name,
      logoUrl: salon.logo_url ?? null,
      role: effectiveRole ?? profile.role,
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      isAdmin,
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
