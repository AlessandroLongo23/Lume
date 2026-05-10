'use client';

import { useMemo } from 'react';
import { useStatisticheStore } from '@/lib/stores/statistiche';
import { useOperatorsStore } from '@/lib/stores/operators';
import { StatSectionCard } from '@/lib/components/admin/statistiche/StatSectionCard';
import { OperatoriComparisonChart } from '@/lib/components/admin/statistiche/operatori/OperatoriComparisonChart';
import { OperatoriTable } from '@/lib/components/admin/statistiche/operatori/OperatoriTable';
import { computeOperatorSummary } from '@/lib/components/admin/statistiche/statHelpers';

export default function OperatoriPage() {
  const statFiches        = useStatisticheStore((s) => s.statFiches);
  const statFicheServices = useStatisticheStore((s) => s.statFicheServices);
  const statFicheProducts = useStatisticheStore((s) => s.statFicheProducts);
  const isLoading         = useStatisticheStore((s) => s.isLoading);
  const operators         = useOperatorsStore((s) => s.operators);

  const summaryRows = useMemo(
    () => computeOperatorSummary(statFiches, statFicheServices, statFicheProducts, operators),
    [statFiches, statFicheServices, statFicheProducts, operators],
  );

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
