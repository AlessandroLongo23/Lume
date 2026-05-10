'use client';

import { useMemo } from 'react';
import { useStatisticheStore } from '@/lib/stores/statistiche';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { useOperatorsStore } from '@/lib/stores/operators';
import { StatSectionCard } from '@/lib/components/admin/statistiche/StatSectionCard';
import { TopServicesBarChart } from '@/lib/components/admin/statistiche/servizi/TopServicesBarChart';
import { ServicesByCategoryDonut } from '@/lib/components/admin/statistiche/servizi/ServicesByCategoryDonut';
import { ServicesByOperatorTable } from '@/lib/components/admin/statistiche/servizi/ServicesByOperatorTable';
import {
  computeServiceLeaderboard, computeServicesByCategory, computeServicesByOperator,
} from '@/lib/components/admin/statistiche/statHelpers';
import { formatCurrency } from '@/lib/utils/format';

export default function ServiziPage() {
  const statFicheServices = useStatisticheStore((s) => s.statFicheServices);
  const isLoading         = useStatisticheStore((s) => s.isLoading);
  const services          = useServicesStore((s) => s.services);
  const categories        = useServiceCategoriesStore((s) => s.service_categories);
  const operators         = useOperatorsStore((s) => s.operators);

  const leaderboard   = useMemo(() => computeServiceLeaderboard(statFicheServices, services, categories), [statFicheServices, services, categories]);
  const byCategory    = useMemo(() => computeServicesByCategory(statFicheServices, services, categories), [statFicheServices, services, categories]);
  const byOperator    = useMemo(() => computeServicesByOperator(statFicheServices, operators), [statFicheServices, operators]);

  if (isLoading) {
    return <div className="h-64 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />;
  }

  return (
    <div className="space-y-4">
      <StatSectionCard title="Top servizi per incasso" subtitle="Primi 10 nel periodo">
        <TopServicesBarChart rows={leaderboard} />
        <div className="border-t border-zinc-100 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="text-left px-5 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">#</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Servizio</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Categoria</th>
                <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">N.</th>
                <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Incasso</th>
                <th className="text-right px-5 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">% inc.</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, i) => (
                <tr key={row.serviceId} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-2.5 text-xs text-zinc-400 tabular-nums">{i + 1}</td>
                  <td className="px-3 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 font-medium">{row.name}</td>
                  <td className="px-3 py-2.5 text-sm text-zinc-500 dark:text-zinc-400">{row.categoryName}</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums text-zinc-600 dark:text-zinc-400">{row.count}</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums font-semibold text-zinc-900 dark:text-zinc-50">{formatCurrency(row.incasso)}</td>
                  <td className="px-5 py-2.5 text-sm text-right tabular-nums text-zinc-500">{row.pctIncasso.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StatSectionCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatSectionCard title="Servizi per categoria">
          <ServicesByCategoryDonut data={byCategory} />
        </StatSectionCard>
        <StatSectionCard title="Servizi per operatore">
          <ServicesByOperatorTable rows={byOperator} />
        </StatSectionCard>
      </div>
    </div>
  );
}
