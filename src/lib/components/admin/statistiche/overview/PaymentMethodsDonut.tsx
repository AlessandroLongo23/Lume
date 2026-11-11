'use client';

import { Donut } from '@/lib/components/graphs/Donut';
import { formatCurrency } from '@/lib/utils/format';
import type { PaymentBreakdownItem } from '../statHelpers';

// Each method keeps its colour whether or not the others appear in the period.
const ORDER = ['Contanti', 'POS', 'Altro'];

interface Props { data: PaymentBreakdownItem[] }

export function PaymentMethodsDonut({ data }: Props) {
  return <Donut data={data} order={ORDER} format={formatCurrency} emptyText="Nessun pagamento nel periodo." />;
}
