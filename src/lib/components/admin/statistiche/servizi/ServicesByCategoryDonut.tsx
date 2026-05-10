'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils/format';
import type { CategoryBreakdown } from '../statHelpers';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface Props { data: CategoryBreakdown[] }

export function ServicesByCategoryDonut({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-xs text-zinc-400 px-5 pb-5">Nessun dato.</p>;
  }
  return (
    <div className="px-5 pb-5">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
            dataKey="value" nameKey="name" paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => [formatCurrency(v as number), 'Incasso']} />
          <Legend iconType="circle" iconSize={8} formatter={(value) => (
            <span className="text-xs text-zinc-600 dark:text-zinc-400">{value}</span>
          )} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
