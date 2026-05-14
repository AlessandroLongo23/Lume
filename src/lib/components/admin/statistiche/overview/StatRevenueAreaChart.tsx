'use client';

import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useTheme } from '@/lib/components/shared/ui/theme/ThemeProvider';
import { formatCurrency } from '@/lib/utils/format';
import type { MonthlyEarnings } from '@/lib/stores/statistiche';
import { makeRechartsTooltip } from '@/lib/components/graphs/RechartsTooltip';

const readVar = (name: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

const areaTooltip = makeRechartsTooltip((v) => [formatCurrency(v as number), '']);

function yTick(v: number) {
  if (v >= 1000) return `€${(v / 1000).toFixed(0)}k`;
  return `€${v}`;
}

interface Props { data: MonthlyEarnings[] }

export function StatRevenueAreaChart({ data }: Props) {
  const { resolvedTheme: theme } = useTheme();
  const colors = useMemo(() => ({
    primary: readVar('--color-brand-primary-500', '#6366F1'),
    border:  readVar('--lume-border', '#E4E4E7'),
    muted:   readVar('--lume-text-muted', '#A1A1AA'),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [theme]);

  return (
    <div className="min-w-0 overflow-hidden px-5 pb-5">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id="statGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={colors.primary} stopOpacity={0.25} />
              <stop offset="95%" stopColor={colors.primary} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" axisLine={{ stroke: colors.border }} tickLine={false}
            tick={{ fontSize: 10, fill: colors.muted }} dy={4} interval="preserveStartEnd" />
          <YAxis axisLine={{ stroke: colors.border }} tickLine={false}
            tick={{ fontSize: 10, fill: colors.muted }} tickFormatter={yTick} width={48} />
          <Tooltip content={areaTooltip}
            cursor={{ stroke: colors.primary, strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Area type="monotone" dataKey="earnings" stroke={colors.primary} strokeWidth={2}
            fill="url(#statGrad)" dot={false} activeDot={{ r: 4, fill: colors.primary, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
