import { LineChart } from 'lucide-react';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { PLANS } from '@/lib/stripe/config';
import { MetricsDashboard, type MetricsData } from './MetricsDashboard';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type SalonRow = {
  id:                   string;
  name:                 string;
  logo_url:             string | null;
  subscription_status:  string;
  subscription_plan:    string | null;
  trial_ends_at:        string;
  subscription_ends_at: string | null;
  created_at:           string;
};

type FicheServiceRow = {
  salon_id:    string;
  final_price: number;
  start_time:  string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function MetricsPage() {
  const supabase = getAdminClient();

  const now = new Date();
  const day60Ago = new Date(now.getTime() - 60 * DAY_MS);

  const [salonsRes, ficheServicesRes] = await Promise.all([
    supabase
      .from('salons')
      .select('id, name, logo_url, subscription_status, subscription_plan, trial_ends_at, subscription_ends_at, created_at')
      .returns<SalonRow[]>(),
    supabase
      .from('fiche_services')
      .select('salon_id, final_price, start_time')
      .gte('start_time', day60Ago.toISOString())
      .returns<FicheServiceRow[]>(),
  ]);

  const data = computeMetrics(salonsRes.data ?? [], ficheServicesRes.data ?? [], now);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Metriche"
        subtitle="Panoramica della piattaforma"
        icon={LineChart}
      />
      <MetricsDashboard data={data} />
    </div>
  );
}

function computeMetrics(
  salons: SalonRow[],
  ficheServices: FicheServiceRow[],
  now: Date,
): MetricsData {
  const day30Ago = new Date(now.getTime() - 30 * DAY_MS);
  const day60Ago = new Date(now.getTime() - 60 * DAY_MS);

  // ── Status + plan counts ─────────────────────────────────────────────
  const statusCounts: Record<string, number> = {};
  for (const s of salons) {
    statusCounts[s.subscription_status] = (statusCounts[s.subscription_status] ?? 0) + 1;
  }
  const activeSalons = salons.filter((s) => s.subscription_status === 'active');
  const activeMonthly = activeSalons.filter((s) => s.subscription_plan === 'monthly').length;
  const activeYearly  = activeSalons.filter((s) => s.subscription_plan === 'yearly').length;

  // ── MRR (cents) — monthly = raw, yearly = raw/12 ─────────────────────
  const mrrOf = (pool: SalonRow[]) =>
    pool.reduce((sum, s) => {
      if (s.subscription_plan === 'monthly') return sum + PLANS.monthly.priceRaw;
      if (s.subscription_plan === 'yearly')  return sum + Math.round(PLANS.yearly.priceRaw / 12);
      return sum;
    }, 0);

  const mrrCents    = mrrOf(activeSalons);
  const mrrAgoCents = mrrOf(activeSalons.filter((s) => new Date(s.created_at) < day30Ago));
  const mrrTrendPct = mrrAgoCents > 0 ? ((mrrCents - mrrAgoCents) / mrrAgoCents) * 100 : null;

  // ── Paying salons trend ──────────────────────────────────────────────
  const payingAgo      = activeSalons.filter((s) => new Date(s.created_at) < day30Ago).length;
  const payingTrendPct = payingAgo > 0 ? ((activeSalons.length - payingAgo) / payingAgo) * 100 : null;

  // ── Signups (30d / prev 30d) ─────────────────────────────────────────
  const signups30 = salons.filter((s) => new Date(s.created_at) >= day30Ago).length;
  const signupsPrev = salons.filter((s) => {
    const d = new Date(s.created_at);
    return d >= day60Ago && d < day30Ago;
  }).length;
  const signupsTrendPct =
    signupsPrev > 0 ? ((signups30 - signupsPrev) / signupsPrev) * 100 : null;

  // ── Signups by month (last 6 months) ─────────────────────────────────
  const monthLabels = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
  const monthlySignups = [];
  let cumulative = salons.filter((s) =>
    new Date(s.created_at) < new Date(now.getFullYear(), now.getMonth() - 5, 1),
  ).length;
  for (let i = 5; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mEnd   = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const ms = salons.filter((s) => {
      const d = new Date(s.created_at);
      return d >= mStart && d < mEnd;
    });
    cumulative += ms.length;
    monthlySignups.push({
      month:    monthLabels[mStart.getMonth()],
      count:    ms.length,
      monthly:  ms.filter((s) => s.subscription_plan === 'monthly').length,
      yearly:   ms.filter((s) => s.subscription_plan === 'yearly').length,
      total:    cumulative,
    });
  }

  // ── GMV (last 30d) ──────────────────────────────────────────────────
  let gmv30 = 0, gmvPrev = 0;
  for (const f of ficheServices) {
    const d = new Date(f.start_time);
    const price = f.final_price ?? 0;
    if (d >= day30Ago) gmv30 += price;
    else if (d >= day60Ago) gmvPrev += price;
  }
  const gmvTrendPct = gmvPrev > 0 ? ((gmv30 - gmvPrev) / gmvPrev) * 100 : null;

  // ── Top 5 salons by revenue (30d) ────────────────────────────────────
  const revenueBySalon = new Map<string, number>();
  for (const f of ficheServices) {
    if (new Date(f.start_time) < day30Ago) continue;
    revenueBySalon.set(f.salon_id, (revenueBySalon.get(f.salon_id) ?? 0) + (f.final_price ?? 0));
  }
  const salonById = new Map(salons.map((s) => [s.id, s]));
  const topSalons = [...revenueBySalon.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, revenue]) => {
      const s = salonById.get(id);
      return {
        id,
        name:    s?.name ?? 'Sconosciuto',
        logoUrl: s?.logo_url ?? null,
        status:  s?.subscription_status ?? 'unknown',
        revenue,
      };
    });

  // ── Trials ending within 7 days ─────────────────────────────────────
  const trialsEnding = salons
    .filter((s) => s.subscription_status === 'trialing')
    .map((s) => ({
      id:           s.id,
      name:         s.name,
      logoUrl:      s.logo_url,
      trialEndsAt:  s.trial_ends_at,
      daysLeft:     Math.ceil((new Date(s.trial_ends_at).getTime() - now.getTime()) / DAY_MS),
    }))
    .filter((t) => t.daysLeft <= 7 && t.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // ── Recent signups (last 5) ─────────────────────────────────────────
  const recentSignups = [...salons]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map((s) => ({
      id:        s.id,
      name:      s.name,
      logoUrl:   s.logo_url,
      status:    s.subscription_status,
      plan:      s.subscription_plan,
      createdAt: s.created_at,
    }));

  return {
    mrrCents,
    mrrTrendPct,
    arrCents: mrrCents * 12,
    payingCount: activeSalons.length,
    payingTrendPct,
    signups30,
    signupsTrendPct,
    gmvCents: gmv30,
    gmvTrendPct,
    totalSalons: salons.length,
    statusCounts,
    activeMonthly,
    activeYearly,
    monthlySignups,
    trialsEnding,
    topSalons,
    recentSignups,
  };
}
