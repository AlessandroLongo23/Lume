'use client';

import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils/format';
import type { MonthlyEarnings } from '@/lib/stores/statistiche';
import { makeRechartsTooltip } from '@/lib/components/graphs/RechartsTooltip';
import { AXIS_TICK, GRID_STROKE, SERIES_PRIMARY, compactEuro } from '@/lib/components/graphs/chartTheme';

const areaTooltip = makeRechartsTooltip((v) => [formatCurrency(v as number), 'Incasso']);

interface Props { data: MonthlyEarnings[] }

/** One series over time: a 2px line on a faint flat wash, hairline grid, no axis lines. */
export function StatRevenueAreaChart({ data }: Props) {
  return (
    <div className="min-w-0 overflow-hidden px-5 pb-5">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} dy={4}
            interval="preserveStartEnd" minTickGap={12} />
          <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} tickFormatter={compactEuro} width={56} />
          <Tooltip content={areaTooltip}
            cursor={{ stroke: 'var(--lume-edge-hover)', strokeWidth: 1 }} />
          <Area type="monotone" dataKey="earnings" stroke={SERIES_PRIMARY} strokeWidth={2}
            fill={SERIES_PRIMARY} fillOpacity={0.08} dot={false}
            activeDot={{ r: 4, fill: SERIES_PRIMARY, stroke: 'var(--lume-surface-raised)', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
