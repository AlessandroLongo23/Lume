'use client';

import { useEffect } from 'react';
import { Callout } from '@/lib/components/shared/ui/Callout';
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
      />
      <div className="flex flex-col gap-6 md:flex-row md:gap-8 md:items-start">
        <StatisticheSidebar />
        {/* While a new period loads, the previous numbers stay readable but dimmed. */}
        <div className={`flex-1 min-w-0 transition-opacity ${isRefreshing ? 'opacity-60' : ''}`} aria-busy={isRefreshing}>
          {error && (
            <Callout
              tone="danger"
              className="mb-4"
              action={<Button variant="secondary" size="sm" onClick={() => fetchForPeriod(dateFrom, dateTo)}>Riprova</Button>}
            >
              {error}
            </Callout>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
