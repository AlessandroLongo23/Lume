import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { getActiveSalonId } from '@/lib/utils/getActiveSalonId';
import { normalizeProfileRole } from '@/lib/auth/roles';

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
      .select('name, trial_ends_at, subscription_status, subscription_plan, subscription_ends_at, referral_code, logo_url')
      .eq('id', salonId)
      .single();

    if (!salon) {
      return NextResponse.json({ error: 'Salone non trovato' }, { status: 404 });
    }

    // Fetch referrals with the referred salon name
    const { data: referralRows } = await supabaseAdmin
      .from('referral_credits')
      .select('id, status, created_at, earned_at, referred_salon:referred_salon_id(name)')
      .eq('referrer_salon_id', salonId)
      .order('created_at', { ascending: false });

    type ReferralRow = {
      id: string;
      status: 'pending' | 'earned' | 'applied';
      created_at: string;
      earned_at: string | null;
      referred_salon: { name: string } | { name: string }[] | null;
    };

    const referrals = ((referralRows ?? []) as unknown as ReferralRow[]).map((r) => {
      const salon = Array.isArray(r.referred_salon) ? r.referred_salon[0] : r.referred_salon;
      return {
        id:        r.id,
        salonName: salon?.name ?? 'Salone',
        status:    r.status,
        createdAt: r.created_at,
        earnedAt:  r.earned_at,
      };
    });

    const pendingCredits = referrals.filter((r) => r.status === 'pending').length;
    const earnedCredits  = referrals.filter((r) => r.status === 'earned' || r.status === 'applied').length;

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
      pendingCredits,
      earnedCredits,
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
