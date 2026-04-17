import { LineChart } from 'lucide-react';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { PLANS } from '@/lib/stripe/config';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function formatEur(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181B]">
      <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-white">{value}</p>
      {hint && <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
    </div>
  );
}

export default async function MetricsPage() {
  const supabase = getAdminClient();

  const { data: salons } = await supabase
    .from('salons')
    .select('subscription_status, subscription_plan, created_at')
    .returns<{ subscription_status: string; subscription_plan: string | null; created_at: string }[]>();

  const all = salons ?? [];

  const byStatus = all.reduce<Record<string, number>>((acc, s) => {
    acc[s.subscription_status] = (acc[s.subscription_status] ?? 0) + 1;
    return acc;
  }, {});

  // MRR: monthly = priceRaw; yearly = priceRaw / 12. Only count active subscribers.
  const mrrCents = all.reduce((sum, s) => {
    if (s.subscription_status !== 'active') return sum;
    if (s.subscription_plan === 'monthly') return sum + PLANS.monthly.priceRaw;
    if (s.subscription_plan === 'yearly')  return sum + Math.round(PLANS.yearly.priceRaw / 12);
    return sum;
  }, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const signupsThisMonth = all.filter((s) => new Date(s.created_at) >= monthStart).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Metriche"
        subtitle="Panoramica della piattaforma"
        icon={LineChart}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="MRR" value={formatEur(mrrCents)} hint="Solo abbonamenti attivi" />
        <Stat label="Saloni totali" value={String(all.length)} />
        <Stat label="Attivi" value={String(byStatus.active ?? 0)} />
        <Stat label="In trial" value={String(byStatus.trialing ?? 0)} />
        <Stat label="Scaduti / non pagati" value={String((byStatus.past_due ?? 0) + (byStatus.unpaid ?? 0))} />
        <Stat label="Annullati" value={String(byStatus.canceled ?? 0)} />
        <Stat label="Nuovi saloni (mese)" value={String(signupsThisMonth)} hint="Dal 1° del mese corrente" />
      </div>
    </div>
  );
}
