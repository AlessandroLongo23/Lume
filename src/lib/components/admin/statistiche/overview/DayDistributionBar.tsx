'use client';

import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { makeRechartsTooltip } from '@/lib/components/graphs/RechartsTooltip';
import { AXIS_TICK, CURSOR_FILL, GRID_STROKE, SERIES_PRIMARY } from '@/lib/components/graphs/chartTheme';
import type { DayCount } from '../statHelpers';

const tooltip = makeRechartsTooltip((v) => [`${v} ${Number(v) === 1 ? 'fiche' : 'fiches'}`, '']);

interface Props { data: DayCount[] }

/** The busiest day at full strength, the others lighter: one hue, emphasis by tone. */
export function DayDistributionBar({ data }: Props) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="px-5 pb-5">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={AXIS_TICK} />
          <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} width={28} />
          <Tooltip content={tooltip} cursor={CURSOR_FILL} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {data.map((d, i) => (
              <Cell key={i} fill={SERIES_PRIMARY} fillOpacity={d.count === max ? 1 : 0.4} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
