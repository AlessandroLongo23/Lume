'use client';

import { useEffect } from 'react';
import { AlertCircle, BarChart2 } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { StatisticheSidebar } from '@/lib/components/admin/statistiche/StatisticheSidebar';
import { useStatisticheStore } from '@/lib/stores/statistiche';

export default function StatisticheLayout({ children }: { children: React.ReactNode }) {
  const fetchForPeriod = useStatisticheStore((s) => s.fetchForPeriod);
  const fetchHistoricalEarnings = useStatisticheStore((s) => s.fetchHistoricalEarnings);
  const dateFrom = useStatisticheStore((s) => s.dateFrom);
  const dateTo = useStatisticheStore((s) => s.dateTo);
  const isRefreshing = useStatisticheStore((s) => s.isRefreshing);
  const error = useStatisticheStore((s) => s.error);

  useEffect(() => {
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
          {error && (
            <div className="mb-4 rounded-lg border border-danger-line bg-danger-soft p-4 flex flex-wrap items-center gap-3 text-sm text-danger-strong">
              <AlertCircle className="size-4 shrink-0" aria-hidden />
              <span className="flex-1">{error}</span>
              <Button variant="secondary" onClick={() => fetchForPeriod(dateFrom, dateTo)}>Riprova</Button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
