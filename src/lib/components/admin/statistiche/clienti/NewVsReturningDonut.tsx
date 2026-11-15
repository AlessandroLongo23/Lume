'use client';

import { Donut } from '@/lib/components/graphs/Donut';
import type { NewVsReturning } from '../statHelpers';

const ORDER = ['Nuovi', 'Abituali'];

interface Props { data: NewVsReturning[] }

export function NewVsReturningDonut({ data }: Props) {
  return (
    <Donut
      data={data}
      order={ORDER}
      format={(v) => `${v.toLocaleString('it-IT')} ${v === 1 ? 'cliente' : 'clienti'}`}
      emptyText="Nessun dato."
    />
  );
}
