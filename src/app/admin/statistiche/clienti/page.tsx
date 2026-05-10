'use client';

import { useMemo } from 'react';
import { useStatisticheStore } from '@/lib/stores/statistiche';
import { useClientsStore } from '@/lib/stores/clients';
import { useFichesStore } from '@/lib/stores/fiches';
import { StatSectionCard } from '@/lib/components/admin/statistiche/StatSectionCard';
import { ClientLeaderboardTable } from '@/lib/components/admin/statistiche/clienti/ClientLeaderboardTable';
import { NewVsReturningDonut } from '@/lib/components/admin/statistiche/clienti/NewVsReturningDonut';
import { DayDistributionBar } from '@/lib/components/admin/statistiche/overview/DayDistributionBar';
import {
  computeClientLeaderboard, computeNewVsReturning, computeDayDistribution,
} from '@/lib/components/admin/statistiche/statHelpers';

export default function ClientiPage() {
  const statFiches        = useStatisticheStore((s) => s.statFiches);
  const statFicheServices = useStatisticheStore((s) => s.statFicheServices);
  const statFicheProducts = useStatisticheStore((s) => s.statFicheProducts);
  const isLoading         = useStatisticheStore((s) => s.isLoading);
  const clients           = useClientsStore((s) => s.clients);
  const allFiches         = useFichesStore((s) => s.fiches);

  const leaderboard = useMemo(
    () => computeClientLeaderboard(statFiches, statFicheServices, statFicheProducts, clients),
    [statFiches, statFicheServices, statFicheProducts, clients],
  );

  const newVsReturning = useMemo(
    () => computeNewVsReturning(statFiches, allFiches),
    [statFiches, allFiches],
  );

  const dayDist = useMemo(() => computeDayDistribution(statFiches), [statFiches]);

  if (isLoading) {
    return <div className="h-64 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />;
  }

  return (
    <div className="space-y-4">
      <StatSectionCard title="Classifica per incasso" subtitle="Tutti i clienti nel periodo">
        <ClientLeaderboardTable rows={leaderboard} sortBy="incasso" />
      </StatSectionCard>

      <StatSectionCard title="Classifica per frequenza" subtitle="Ordinata per numero di presenze">
        <ClientLeaderboardTable rows={leaderboard} sortBy="presenze" />
      </StatSectionCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatSectionCard title="Nuovi vs. abituali" subtitle="Clienti nel periodo">
          <NewVsReturningDonut data={newVsReturning} />
        </StatSectionCard>
        <StatSectionCard title="Presenze per giorno" subtitle="Giorno della settimana">
          <DayDistributionBar data={dayDist} />
        </StatSectionCard>
      </div>
    </div>
  );
}
