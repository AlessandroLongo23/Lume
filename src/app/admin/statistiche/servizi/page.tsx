'use client';

import { useMemo } from 'react';
import { useStatisticheStore } from '@/lib/stores/statistiche';
import { StatSectionCard } from '@/lib/components/admin/statistiche/StatSectionCard';
import { TopServicesBarChart } from '@/lib/components/admin/statistiche/servizi/TopServicesBarChart';
import { ServicesByCategoryDonut } from '@/lib/components/admin/statistiche/servizi/ServicesByCategoryDonut';
import { ServicesByOperatorTable } from '@/lib/components/admin/statistiche/servizi/ServicesByOperatorTable';
import {
  toServiceLeaderboard, toCategoryBreakdown, toServicesByOperator,
} from '@/lib/components/admin/statistiche/statHelpers';
import { formatCurrency } from '@/lib/utils/format';
import { cellNumClass, cellStrongClass, tableClass, tbodyClass, tdClass, thClass, theadClass, trClass } from '@/lib/components/shared/ui/table/tableStyles';

export default function ServiziPage() {
  const data      = useStatisticheStore((s) => s.data);
  const isLoading = useStatisticheStore((s) => s.isLoading);

  const leaderboard = useMemo(() => toServiceLeaderboard(data), [data]);
  const byCategory  = useMemo(() => toCategoryBreakdown(data?.servizi_categorie), [data]);
  const byOperator  = useMemo(() => toServicesByOperator(data), [data]);

  if (isLoading) {
    return <div className="h-64 rounded-xl bg-hover animate-pulse motion-reduce:animate-none" />;
  }

  return (
    <div className="space-y-4">
      <StatSectionCard title="Top servizi per incasso" subtitle="Primi 10 nel periodo">
        <TopServicesBarChart rows={leaderboard} />
        {leaderboard.length > 0 && (
        <div className="border-t border-line">
          <table className={`${tableClass} min-w-128`}>
            <thead className={theadClass}>
              <tr>
                <th className={`${thClass()} first:pl-5 last:pr-5`}>#</th>
                <th className={`${thClass()} first:pl-5 last:pr-5`}>Servizio</th>
                <th className={`${thClass()} first:pl-5 last:pr-5`}>Categoria</th>
                <th className={`${thClass({ align: 'right' })} first:pl-5 last:pr-5`}>Numero</th>
                <th className={`${thClass({ align: 'right' })} first:pl-5 last:pr-5`}>Incasso</th>
                <th className={`${thClass({ align: 'right' })} first:pl-5 last:pr-5`}>% incasso</th>
              </tr>
            </thead>
            <tbody className={tbodyClass}>
              {leaderboard.map((row, i) => (
                <tr key={row.serviceId} className={trClass({ interactive: false })}>
                  <td className={`${tdClass} ${cellNumClass} text-[var(--lume-text-muted)] first:pl-5 last:pr-5`}>{i + 1}</td>
                  <td className={`${tdClass} ${cellStrongClass} first:pl-5 last:pr-5`}>{row.name}</td>
                  <td className={`${tdClass} first:pl-5 last:pr-5`}>{row.categoryName}</td>
                  <td className={`${tdClass} ${cellNumClass} text-right first:pl-5 last:pr-5`}>{row.count}</td>
                  <td className={`${tdClass} ${cellNumClass} text-[var(--lume-text)] text-right first:pl-5 last:pr-5`}>{formatCurrency(row.incasso)}</td>
                  <td className={`${tdClass} ${cellNumClass} text-right first:pl-5 last:pr-5`}>{row.pctIncasso.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </StatSectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
