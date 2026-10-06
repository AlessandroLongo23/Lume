'use client';

import { useMemo } from 'react';
import { useStatisticheStore } from '@/lib/stores/statistiche';
import { StatSectionCard } from '@/lib/components/admin/statistiche/StatSectionCard';
import { TopProductsBarChart } from '@/lib/components/admin/statistiche/prodotti/TopProductsBarChart';
import { ProductsByCategoryDonut } from '@/lib/components/admin/statistiche/prodotti/ProductsByCategoryDonut';
import { toProductLeaderboard, toCategoryBreakdown } from '@/lib/components/admin/statistiche/statHelpers';
import { formatCurrency } from '@/lib/utils/format';

export default function ProdottiPage() {
  const data      = useStatisticheStore((s) => s.data);
  const isLoading = useStatisticheStore((s) => s.isLoading);

  const leaderboard = useMemo(() => toProductLeaderboard(data), [data]);
  const byCategory  = useMemo(() => toCategoryBreakdown(data?.prodotti_categorie), [data]);

  if (isLoading) {
    return <div className="h-64 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />;
  }

  return (
    <div className="space-y-4">
      <StatSectionCard title="Top prodotti venduti" subtitle="Per incasso nel periodo">
        <TopProductsBarChart rows={leaderboard} />
        <div className="border-t border-zinc-100 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="text-left px-5 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">#</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Prodotto</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Categoria</th>
                <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Qtà</th>
                <th className="text-right px-5 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Incasso</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, i) => (
                <tr key={row.productId} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-2.5 text-xs text-zinc-400 tabular-nums">{i + 1}</td>
                  <td className="px-3 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 font-medium">{row.name}</td>
                  <td className="px-3 py-2.5 text-sm text-zinc-500 dark:text-zinc-400">{row.categoryName}</td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums text-zinc-600 dark:text-zinc-400">{row.qty}</td>
                  <td className="px-5 py-2.5 text-sm text-right tabular-nums font-semibold text-zinc-900 dark:text-zinc-50">{formatCurrency(row.incasso)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StatSectionCard>

      <StatSectionCard title="Prodotti per categoria">
        <ProductsByCategoryDonut data={byCategory} />
      </StatSectionCard>
    </div>
  );
}
