'use client';

import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { makeRechartsTooltip } from '@/lib/components/graphs/RechartsTooltip';
import { AXIS_TICK, CURSOR_FILL, GRID_STROKE, SERIES_PRIMARY, compactEuro } from '@/lib/components/graphs/chartTheme';
import { formatCurrency } from '@/lib/utils/format';

interface RankedBarsProps {
  data: { name: string; incasso: number }[];
  emptyText: string;
}

/**
 * Horizontal bars for a top-N ranking. One series, so one colour: the rank
 * is already told by length and order, never by hue.
 */
export function RankedBars({ data, emptyText }: RankedBarsProps) {
  if (data.length === 0) {
    return <p className="text-sm text-[var(--lume-text-muted)] px-5 pb-5">{emptyText}</p>;
  }
  const tooltip = makeRechartsTooltip((v) => [formatCurrency(Number(v)), 'Incasso']);

  return (
    <div className="px-5 pb-5">
      <ResponsiveContainer width="100%" height={Math.max(160, data.length * 32)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} stroke={GRID_STROKE} />
          <XAxis type="number" axisLine={false} tickLine={false} tick={AXIS_TICK} tickFormatter={compactEuro} />
          <YAxis
            type="category"
            dataKey="name"
            width={190}
            axisLine={false}
            tickLine={false}
            tick={{ ...AXIS_TICK, fill: 'var(--lume-text-secondary)' }}
          />
          <Tooltip content={tooltip} cursor={CURSOR_FILL} />
          <Bar dataKey="incasso" fill={SERIES_PRIMARY} radius={[0, 4, 4, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
