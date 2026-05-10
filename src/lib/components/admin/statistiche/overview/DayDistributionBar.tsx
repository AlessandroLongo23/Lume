'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/lib/components/shared/ui/theme/ThemeProvider';
import type { DayCount } from '../statHelpers';

const readVar = (name: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

interface Props { data: DayCount[] }

export function DayDistributionBar({ data }: Props) {
  const { resolvedTheme: theme } = useTheme();
  const colors = useMemo(() => ({
    primary: readVar('--color-brand-primary-500', '#6366F1'),
    border:  readVar('--lume-border', '#E4E4E7'),
    muted:   readVar('--lume-text-muted', '#A1A1AA'),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [theme]);

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="px-5 pb-5">
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -24 }}>
          <XAxis dataKey="day" axisLine={false} tickLine={false}
            tick={{ fontSize: 11, fill: colors.muted }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: colors.muted }} />
          <Tooltip formatter={(v) => [`${v} fiches`, '']} cursor={{ fill: 'transparent' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.count === max ? colors.primary : `${colors.primary}40`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
