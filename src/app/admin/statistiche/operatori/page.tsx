'use client';

import { useMemo } from 'react';
import { useStatisticheStore } from '@/lib/stores/statistiche';
import { StatSectionCard } from '@/lib/components/admin/statistiche/StatSectionCard';
import { OperatoriComparisonChart } from '@/lib/components/admin/statistiche/operatori/OperatoriComparisonChart';
import { OperatoriTable } from '@/lib/components/admin/statistiche/operatori/OperatoriTable';
import { toOperatorSummary } from '@/lib/components/admin/statistiche/statHelpers';

export default function OperatoriPage() {
  const data      = useStatisticheStore((s) => s.data);
  const isLoading = useStatisticheStore((s) => s.isLoading);

  const summaryRows = useMemo(() => toOperatorSummary(data), [data]);

  if (isLoading) {
    return <div className="h-64 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />;
  }

  return (
    <div className="space-y-4">
      <StatSectionCard title="Confronto operatori" subtitle="Incasso e fiches nel periodo">
        <OperatoriComparisonChart rows={summaryRows} />
      </StatSectionCard>

      <StatSectionCard title="Riepilogo per operatore">
        <OperatoriTable rows={summaryRows} />
      </StatSectionCard>
    </div>
  );
}
