'use client';

import { useMemo } from 'react';
import { useStatisticheStore } from '@/lib/stores/statistiche';
import { StatSectionCard } from '@/lib/components/admin/statistiche/StatSectionCard';
import { ClientLeaderboardTable } from '@/lib/components/admin/statistiche/clienti/ClientLeaderboardTable';
import { NewVsReturningDonut } from '@/lib/components/admin/statistiche/clienti/NewVsReturningDonut';
import { DayDistributionBar } from '@/lib/components/admin/statistiche/overview/DayDistributionBar';
import {
  toClientLeaderboard, toNewVsReturning, toDayDistribution,
} from '@/lib/components/admin/statistiche/statHelpers';

export default function ClientiPage() {
  const data      = useStatisticheStore((s) => s.data);
  const isLoading = useStatisticheStore((s) => s.isLoading);

  const leaderboard = useMemo(() => toClientLeaderboard(data), [data]);
  const newVsReturning = useMemo(() => toNewVsReturning(data), [data]);
  const dayDist = useMemo(() => toDayDistribution(data), [data]);

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
