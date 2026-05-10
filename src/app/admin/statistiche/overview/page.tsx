'use client';

import { useMemo } from 'react';
import { Euro, Receipt, TrendingUp, Users } from 'lucide-react';
import { useStatisticheStore } from '@/lib/stores/statistiche';
import { useClientsStore } from '@/lib/stores/clients';
import { StatKpiCard } from '@/lib/components/admin/statistiche/StatKpiCard';
import { StatSectionCard } from '@/lib/components/admin/statistiche/StatSectionCard';
import { StatRevenueAreaChart } from '@/lib/components/admin/statistiche/overview/StatRevenueAreaChart';
import { PaymentMethodsDonut } from '@/lib/components/admin/statistiche/overview/PaymentMethodsDonut';
import { DayDistributionBar } from '@/lib/components/admin/statistiche/overview/DayDistributionBar';
import { TopClientsPreviewTable } from '@/lib/components/admin/statistiche/overview/TopClientsPreviewTable';
import {
  computeKpis, computePaymentBreakdown,
  computeDayDistribution, computeClientLeaderboard,
} from '@/lib/components/admin/statistiche/statHelpers';
import { formatCurrency } from '@/lib/utils/format';

export default function OverviewPage() {
  const statFiches         = useStatisticheStore((s) => s.statFiches);
  const statFicheServices  = useStatisticheStore((s) => s.statFicheServices);
  const statFicheProducts  = useStatisticheStore((s) => s.statFicheProducts);
  const statFichePayments  = useStatisticheStore((s) => s.statFichePayments);
  const historicalEarnings = useStatisticheStore((s) => s.historicalEarnings);
  const isLoading          = useStatisticheStore((s) => s.isLoading);
  const clients            = useClientsStore((s) => s.clients);

  const kpis = useMemo(
    () => computeKpis(statFiches, statFicheServices, statFicheProducts),
    [statFiches, statFicheServices, statFicheProducts],
  );

  const paymentBreakdown = useMemo(
    () => computePaymentBreakdown(statFichePayments),
    [statFichePayments],
  );

  const dayDistribution = useMemo(
    () => computeDayDistribution(statFiches),
    [statFiches],
  );

  const clientLeaderboard = useMemo(
    () => computeClientLeaderboard(statFiches, statFicheServices, statFicheProducts, clients),
    [statFiches, statFicheServices, statFicheProducts, clients],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatKpiCard
          label="Incasso"
          displayValue={formatCurrency(kpis.totalRevenue)}
          icon={Euro}
        />
        <StatKpiCard
          label="Fiches chiuse"
          displayValue={String(kpis.ficheCount)}
          icon={Receipt}
        />
        <StatKpiCard
          label="Scontrino medio"
          displayValue={formatCurrency(kpis.avgTicket)}
          icon={TrendingUp}
        />
        <StatKpiCard
          label="Clienti attivi"
          displayValue={String(kpis.activeClients)}
          icon={Users}
        />
      </div>

      {/* Revenue trend */}
      <StatSectionCard title="Andamento incassi" subtitle="Ultimi 13 mesi">
        <StatRevenueAreaChart data={historicalEarnings} />
      </StatSectionCard>

      {/* Two-column row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatSectionCard title="Metodi di pagamento" subtitle="Nel periodo selezionato">
          <PaymentMethodsDonut data={paymentBreakdown} />
        </StatSectionCard>
        <StatSectionCard title="Presenze per giorno" subtitle="Fiches per giorno della settimana">
          <DayDistributionBar data={dayDistribution} />
        </StatSectionCard>
      </div>

      {/* Top clients preview */}
      <StatSectionCard title="Top clienti per incasso" subtitle="Nel periodo selezionato">
        <TopClientsPreviewTable rows={clientLeaderboard} />
      </StatSectionCard>
    </div>
  );
}
