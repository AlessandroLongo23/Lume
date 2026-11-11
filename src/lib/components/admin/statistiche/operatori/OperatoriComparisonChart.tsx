'use client';

import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils/format';
import { makeRechartsTooltip } from '@/lib/components/graphs/RechartsTooltip';
import { AXIS_TICK, CURSOR_FILL, GRID_STROKE, SERIES_PRIMARY, SERIES_SECONDARY, compactEuro } from '@/lib/components/graphs/chartTheme';
import type { OperatorSummaryRow } from '../statHelpers';

const incassoTooltip = makeRechartsTooltip((v) => [formatCurrency(Number(v)), 'Incasso']);
const fichesTooltip = makeRechartsTooltip((v) => [String(v), 'Fiches']);

interface Props { rows: OperatorSummaryRow[] }

/**
 * Revenue and fiches per operator as two small charts side by side, each on
 * its own scale: one chart with two y-axes invites false comparisons.
 */
export function OperatoriComparisonChart({ rows }: Props) {
  const data = rows.map((r) => ({ name: r.name, incasso: r.incasso, fiches: r.ficheCount }));

  if (data.length === 0) {
    return <p className="text-sm text-[var(--lume-text-muted)] px-5 pb-5">Nessun operatore nel periodo.</p>;
  }

  return (
    <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-6">
      <MiniBars title="Incasso" color={SERIES_PRIMARY} data={data} dataKey="incasso"
        tooltip={incassoTooltip} tickFormatter={compactEuro} />
      <MiniBars title="Fiches" color={SERIES_SECONDARY} data={data} dataKey="fiches"
        tooltip={fichesTooltip} />
    </div>
  );
}

function MiniBars({ title, color, data, dataKey, tooltip, tickFormatter }: {
  title: string;
  color: string;
  data: { name: string; incasso: number; fiches: number }[];
  dataKey: 'incasso' | 'fiches';
  tooltip: ReturnType<typeof makeRechartsTooltip>;
  tickFormatter?: (v: number) => string;
}) {
  return (
    <figure className="min-w-0">
      <figcaption className="mb-2 flex items-center gap-2 text-xs text-[var(--lume-text-secondary)]">
        <span className="size-2 rounded-full" style={{ background: color }} aria-hidden />
        {title}
      </figcaption>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={AXIS_TICK} interval={0} />
          <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} width={tickFormatter ? 56 : 28}
            allowDecimals={false} tickFormatter={tickFormatter} />
          <Tooltip content={tooltip} cursor={CURSOR_FILL} />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
