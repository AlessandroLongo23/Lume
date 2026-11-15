'use client';

import { Donut } from '@/lib/components/graphs/Donut';
import { formatCurrency } from '@/lib/utils/format';
import type { CategoryBreakdown } from '../statHelpers';

interface Props { data: CategoryBreakdown[] }

export function ProductsByCategoryDonut({ data }: Props) {
  return <Donut data={data} format={formatCurrency} emptyText="Nessun dato." />;
}
