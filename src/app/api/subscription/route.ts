import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

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
      .select('salon_id, role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 });
    }

    const { data: salon } = await supabaseAdmin
      .from('salons')
      .select('trial_ends_at, subscription_status, subscription_plan, subscription_ends_at, referral_code')
      .eq('id', profile.salon_id)
      .single();

    if (!salon) {
      return NextResponse.json({ error: 'Salone non trovato' }, { status: 404 });
    }

    // Count referral credits
    const { count: pendingCredits } = await supabaseAdmin
      .from('referral_credits')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_salon_id', profile.salon_id)
      .eq('status', 'pending');

    const { count: earnedCredits } = await supabaseAdmin
      .from('referral_credits')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_salon_id', profile.salon_id)
      .in('status', ['earned', 'applied']);

    const now = new Date();
    const trialEnd = new Date(salon.trial_ends_at);
    const trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const isActive = salon.subscription_status === 'active';
    const isTrialing = salon.subscription_status === 'trialing' && trialDaysLeft > 0;
    const isExpired = !isActive && !isTrialing;
    const showTrialWarning = isTrialing && trialDaysLeft <= 7;

    return NextResponse.json({
      isTrialing,
      isActive,
      isExpired,
      trialDaysLeft,
      showTrialWarning,
      subscriptionStatus: salon.subscription_status,
      subscriptionPlan: salon.subscription_plan,
      subscriptionEndsAt: salon.subscription_ends_at,
      referralCode: salon.referral_code,
      pendingCredits: pendingCredits ?? 0,
      earnedCredits: earnedCredits ?? 0,
      role: profile.role,
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
