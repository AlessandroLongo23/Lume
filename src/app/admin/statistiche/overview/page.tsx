'use client';

import { useMemo } from 'react';
import { useStatisticheStore } from '@/lib/stores/statistiche';
import { Stat, StatRow } from '@/lib/components/shared/ui/StatRow';
import { StatSectionCard } from '@/lib/components/admin/statistiche/StatSectionCard';
import { StatRevenueAreaChart } from '@/lib/components/admin/statistiche/overview/StatRevenueAreaChart';
import { PaymentMethodsDonut } from '@/lib/components/admin/statistiche/overview/PaymentMethodsDonut';
import { DayDistributionBar } from '@/lib/components/admin/statistiche/overview/DayDistributionBar';
import { TopClientsPreviewTable } from '@/lib/components/admin/statistiche/overview/TopClientsPreviewTable';
import {
  toKpis, toPaymentBreakdown, toDayDistribution, toClientLeaderboard,
} from '@/lib/components/admin/statistiche/statHelpers';
import { formatCurrency } from '@/lib/utils/format';

export default function OverviewPage() {
  const data               = useStatisticheStore((s) => s.data);
  const historicalEarnings = useStatisticheStore((s) => s.historicalEarnings);
  const isLoading          = useStatisticheStore((s) => s.isLoading);

  const kpis = useMemo(() => toKpis(data), [data]);
  const paymentBreakdown = useMemo(() => toPaymentBreakdown(data), [data]);
  const dayDistribution = useMemo(() => toDayDistribution(data), [data]);
  const clientLeaderboard = useMemo(() => toClientLeaderboard(data), [data]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-hover animate-pulse motion-reduce:animate-none" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-hover animate-pulse motion-reduce:animate-none" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <StatRow className="sm:grid-cols-4">
        <Stat label="Incasso" value={formatCurrency(kpis.totalRevenue)} />
        <Stat label="Fiches chiuse" value={String(kpis.ficheCount)} />
        <Stat label="Scontrino medio" value={formatCurrency(kpis.avgTicket)} />
        <Stat label="Clienti attivi" value={String(kpis.activeClients)} />
      </StatRow>

      {/* Revenue trend */}
      <StatSectionCard title="Andamento incassi" subtitle="Ultimi 13 mesi">
        <StatRevenueAreaChart data={historicalEarnings} />
      </StatSectionCard>

      {/* Two-column row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
