'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useTheme } from '@/lib/components/shared/ui/theme/ThemeProvider';
import { formatCurrency } from '@/lib/utils/format';
import type { OperatorSummaryRow } from '../statHelpers';

const readVar = (name: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

interface Props { rows: OperatorSummaryRow[] }

export function OperatoriComparisonChart({ rows }: Props) {
  const { resolvedTheme: theme } = useTheme();
  const colors = useMemo(() => ({
    primary: readVar('--color-brand-primary-500', '#6366F1'),
    muted:   readVar('--lume-text-muted', '#A1A1AA'),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [theme]);

  const data = rows.map((r) => ({ name: r.name, incasso: r.incasso, fiches: r.ficheCount }));

  if (data.length === 0) {
    return <p className="text-xs text-zinc-400 px-5 pb-5">Nessun operatore nel periodo.</p>;
  }

  return (
    <div className="px-5 pb-5">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 4 }}>
          <XAxis dataKey="name" axisLine={false} tickLine={false}
            tick={{ fontSize: 11, fill: colors.muted }} />
          <YAxis yAxisId="incasso" orientation="left" axisLine={false} tickLine={false}
            tick={{ fontSize: 10, fill: colors.muted }} tickFormatter={(v) => `€${v}`} />
          <YAxis yAxisId="fiches" orientation="right" axisLine={false} tickLine={false}
            tick={{ fontSize: 10, fill: colors.muted }} />
          <Tooltip
            formatter={(v, name) =>
              name === 'incasso' ? [formatCurrency(v as number), 'Incasso'] : [v, 'Fiches']
            }
          />
          <Legend formatter={(value) => (
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              {value === 'incasso' ? 'Incasso' : 'N. fiches'}
            </span>
          )} />
          <Bar yAxisId="incasso" dataKey="incasso" fill={colors.primary} radius={[4, 4, 0, 0]} />
          <Bar yAxisId="fiches" dataKey="fiches" fill={`${colors.primary}50`} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
