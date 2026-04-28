'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Receipt } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/format';
import { useTheme } from '@/lib/components/shared/ui/theme/ThemeProvider';

/** Read a CSS custom property from :root — recharts needs concrete color
 *  strings for SVG props, so we resolve tokens at render time. */
const readVar = (name: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

interface RevenueChartProps {
  data: { label: string; earnings: number }[];
  isEmpty?: boolean;
}

interface TooltipPayload {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 shadow-sm text-left">
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

function yTickFormatter(v: number): string {
  if (v >= 1000) return `€${(v / 1000).toFixed(1)}k`;
  return `€${v}`;
}

export function RevenueChart({ data, isEmpty }: RevenueChartProps) {
  const { resolvedTheme: theme } = useTheme();

  const colors = useMemo(
    () => ({
      primary: readVar('--color-brand-primary-500', '#6366F1'),
      border: readVar('--lume-border', '#E4E4E7'),
      muted: readVar('--lume-text-muted', '#A1A1AA'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme],
  );

  return (
    <Card className="bg-card border-border ring-0 border">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">
          Andamento Ricavi
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-[350px] gap-4">
            <div className="rounded-full bg-muted p-4">
              <Receipt className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Nessun dato finanziario
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Aggiungi le tue fiches per generare il bilancio
              </p>
            </div>
            <Link
              href="/admin/fiches"
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Vai alle Fiches →
            </Link>
          </div>
        ) : (
          /* min-w-0 + overflow-hidden prevents ResponsiveContainer from expanding infinitely in flex/grid */
          <div className="min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <defs>
                  <linearGradient id="lumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={colors.primary} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={colors.primary} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  axisLine={{ stroke: colors.border }}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: colors.muted }}
                  dy={4}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={{ stroke: colors.border }}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: colors.muted }}
                  tickFormatter={yTickFormatter}
                  width={52}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: colors.primary, strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke={colors.primary}
                  strokeWidth={2}
                  fill="url(#lumeGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: colors.primary, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
