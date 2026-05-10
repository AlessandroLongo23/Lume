'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/lib/components/shared/ui/theme/ThemeProvider';
import { formatCurrency } from '@/lib/utils/format';
import type { ServiceRow } from '../statHelpers';

const readVar = (name: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

interface Props { rows: ServiceRow[] }

export function TopServicesBarChart({ rows }: Props) {
  const { resolvedTheme: theme } = useTheme();
  const colors = useMemo(() => ({
    primary: readVar('--color-brand-primary-500', '#6366F1'),
    muted:   readVar('--lume-text-muted', '#A1A1AA'),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [theme]);

  const top10 = rows.slice(0, 10).map((r) => ({ name: r.name, incasso: r.incasso }));
  const max   = Math.max(...top10.map((r) => r.incasso), 1);

  if (top10.length === 0) {
    return <p className="text-xs text-zinc-400 px-5 pb-5">Nessun servizio nel periodo.</p>;
  }

  return (
    <div className="px-5 pb-5">
      <ResponsiveContainer width="100%" height={Math.max(160, top10.length * 32)}>
        <BarChart data={top10} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
          <XAxis type="number" axisLine={false} tickLine={false}
            tick={{ fontSize: 10, fill: colors.muted }} tickFormatter={(v) => `€${v}`} />
          <YAxis type="category" dataKey="name" width={130} axisLine={false} tickLine={false}
            tick={{ fontSize: 11, fill: colors.muted }} />
          <Tooltip formatter={(v) => [formatCurrency(v as number), 'Incasso']} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
          <Bar dataKey="incasso" radius={[0, 4, 4, 0]}>
            {top10.map((r, i) => (
              <Cell key={i} fill={r.incasso === max ? colors.primary : `${colors.primary}60`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
