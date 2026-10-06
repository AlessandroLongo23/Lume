'use client';

import { useEffect } from 'react';
import { BarChart2 } from 'lucide-react';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { StatisticheSidebar } from '@/lib/components/admin/statistiche/StatisticheSidebar';
import { useStatisticheStore } from '@/lib/stores/statistiche';
import { useFicheProductsStore } from '@/lib/stores/fiche_products';

export default function StatisticheLayout({ children }: { children: React.ReactNode }) {
  const fetchForPeriod = useStatisticheStore((s) => s.fetchForPeriod);
  const fetchHistoricalEarnings = useStatisticheStore((s) => s.fetchHistoricalEarnings);
  const fetchFicheProducts = useFicheProductsStore((s) => s.fetchFicheProducts);
  const dateFrom = useStatisticheStore((s) => s.dateFrom);
  const dateTo = useStatisticheStore((s) => s.dateTo);
  const isRefreshing = useStatisticheStore((s) => s.isRefreshing);

  useEffect(() => {
    fetchFicheProducts();
    fetchHistoricalEarnings();
    fetchForPeriod(dateFrom, dateTo);
  // Only run on mount — period changes are driven by PeriodPicker
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-6 h-full">
      <PageHeader
        title="Statistiche"
        subtitle="Analizza le performance del tuo salone."
        icon={BarChart2}
      />
      <div className="flex gap-8 items-start">
        <StatisticheSidebar />
        {/* While a new period loads, the previous numbers stay readable but dimmed. */}
        <div className={`flex-1 min-w-0 transition-opacity ${isRefreshing ? 'opacity-60' : ''}`} aria-busy={isRefreshing}>
          {children}
        </div>
      </div>
    </div>
  );
}
