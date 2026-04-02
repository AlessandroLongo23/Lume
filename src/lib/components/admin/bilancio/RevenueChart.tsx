'use client';

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
  return (
    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 ring-0 border h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Andamento Ricavi
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-[220px] gap-4">
            <div className="rounded-full bg-zinc-100 dark:bg-zinc-800 p-4">
              <Receipt className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Nessun dato finanziario
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Aggiungi le tue fiches per generare il bilancio
              </p>
            </div>
            <Link
              href="/admin/fiches"
              className="text-xs font-medium text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Vai alle Fiches →
            </Link>
          </div>
        ) : (
          /* min-w-0 + overflow-hidden prevents ResponsiveContainer from expanding infinitely in flex/grid */
          <div className="min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <defs>
                  <linearGradient id="lumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  axisLine={{ stroke: '#E4E4E7' }}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#A1A1AA' }}
                  dy={4}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={{ stroke: '#E4E4E7' }}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#A1A1AA' }}
                  tickFormatter={yTickFormatter}
                  width={52}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: '#6366F1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fill="url(#lumeGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#6366F1', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
