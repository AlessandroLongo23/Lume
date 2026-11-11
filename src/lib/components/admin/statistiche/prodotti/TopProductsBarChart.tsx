'use client';

import { RankedBars } from '@/lib/components/graphs/RankedBars';
import type { ProductRow } from '../statHelpers';

interface Props { rows: ProductRow[] }

export function TopProductsBarChart({ rows }: Props) {
  const top10 = rows.slice(0, 10).map((r) => ({ name: r.name, incasso: r.incasso }));
  return <RankedBars data={top10} emptyText="Nessun prodotto venduto nel periodo." />;
}
