'use client';

import { RankedBars } from '@/lib/components/graphs/RankedBars';
import type { ServiceRow } from '../statHelpers';

interface Props { rows: ServiceRow[] }

export function TopServicesBarChart({ rows }: Props) {
  const top10 = rows.slice(0, 10).map((r) => ({ name: r.name, incasso: r.incasso }));
  return <RankedBars data={top10} emptyText="Nessun servizio nel periodo." />;
}
