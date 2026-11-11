'use client';

import { useMemo } from 'react';
import { useStatisticheStore } from '@/lib/stores/statistiche';
import { StatSectionCard } from '@/lib/components/admin/statistiche/StatSectionCard';
import { TopProductsBarChart } from '@/lib/components/admin/statistiche/prodotti/TopProductsBarChart';
import { ProductsByCategoryDonut } from '@/lib/components/admin/statistiche/prodotti/ProductsByCategoryDonut';
import { toProductLeaderboard, toCategoryBreakdown } from '@/lib/components/admin/statistiche/statHelpers';
import { formatCurrency } from '@/lib/utils/format';
import { cellNumClass, cellStrongClass, tableClass, tbodyClass, tdClass, thClass, theadClass, trClass } from '@/lib/components/shared/ui/table/tableStyles';

export default function ProdottiPage() {
  const data      = useStatisticheStore((s) => s.data);
  const isLoading = useStatisticheStore((s) => s.isLoading);

  const leaderboard = useMemo(() => toProductLeaderboard(data), [data]);
  const byCategory  = useMemo(() => toCategoryBreakdown(data?.prodotti_categorie), [data]);

  if (isLoading) {
    return <div className="h-64 rounded-xl bg-hover animate-pulse motion-reduce:animate-none" />;
  }

  return (
    <div className="space-y-4">
      <StatSectionCard title="Top prodotti venduti" subtitle="Per incasso nel periodo">
        <TopProductsBarChart rows={leaderboard} />
        {leaderboard.length > 0 && (
        <div className="border-t border-line">
          <table className={`${tableClass} min-w-128`}>
            <thead className={theadClass}>
              <tr>
                <th className={`${thClass()} first:pl-5 last:pr-5`}>#</th>
                <th className={`${thClass()} first:pl-5 last:pr-5`}>Prodotto</th>
                <th className={`${thClass()} first:pl-5 last:pr-5`}>Categoria</th>
                <th className={`${thClass({ align: 'right' })} first:pl-5 last:pr-5`}>Quantità</th>
                <th className={`${thClass({ align: 'right' })} first:pl-5 last:pr-5`}>Incasso</th>
              </tr>
            </thead>
            <tbody className={tbodyClass}>
              {leaderboard.map((row, i) => (
                <tr key={row.productId} className={trClass({ interactive: false })}>
                  <td className={`${tdClass} ${cellNumClass} text-[var(--lume-text-muted)] first:pl-5 last:pr-5`}>{i + 1}</td>
                  <td className={`${tdClass} ${cellStrongClass} first:pl-5 last:pr-5`}>{row.name}</td>
                  <td className={`${tdClass} first:pl-5 last:pr-5`}>{row.categoryName}</td>
                  <td className={`${tdClass} ${cellNumClass} text-right first:pl-5 last:pr-5`}>{row.qty}</td>
                  <td className={`${tdClass} ${cellNumClass} text-[var(--lume-text)] text-right first:pl-5 last:pr-5`}>{formatCurrency(row.incasso)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </StatSectionCard>

      <StatSectionCard title="Prodotti per categoria">
        <ProductsByCategoryDonut data={byCategory} />
      </StatSectionCard>
    </div>
  );
}
