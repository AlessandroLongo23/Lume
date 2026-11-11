'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { makeRechartsTooltip } from '@/lib/components/graphs/RechartsTooltip';
import { CATEGORICAL_COLORS, SERIES_OTHER, foldSlices } from '@/lib/components/graphs/chartTheme';

interface DonutProps {
  data: { name: string; value: number }[];
  /** Formats a slice value for the legend and the tooltip. */
  format: (value: number) => string;
  emptyText: string;
  /**
   * Fixed entity order (e.g. payment methods): a slice keeps its colour even
   * when another one is missing. Without it, the largest slices are coloured
   * and the rest fold into "Altre".
   */
  order?: string[];
}

/**
 * Donut with its legend beside it: name, value and share for every slice,
 * so identity never rests on colour alone and the numbers are readable
 * without hovering.
 */
export function Donut({ data, format, emptyText, order }: DonutProps) {
  if (data.length === 0) {
    return <p className="text-sm text-[var(--lume-text-muted)] px-5 pb-5">{emptyText}</p>;
  }

  const slices = order
    ? [...data].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name))
    : foldSlices(data);
  const colorOf = (name: string, i: number) => {
    if (order) return CATEGORICAL_COLORS[order.indexOf(name)] ?? SERIES_OTHER;
    return i < CATEGORICAL_COLORS.length ? CATEGORICAL_COLORS[i] : SERIES_OTHER;
  };
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const tooltip = makeRechartsTooltip((v, name) => [format(Number(v)), name]);

  return (
    <div className="@container px-5 pb-5">
      <div className="flex flex-col @md:flex-row items-center gap-6">
        <div className="size-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius="62%"
                outerRadius="100%"
                stroke={slices.length > 1 ? 'var(--lume-surface-raised)' : 'none'}
                strokeWidth={2}
                isAnimationActive={false}
              >
                {slices.map((s, i) => <Cell key={s.name} fill={colorOf(s.name, i)} />)}
              </Pie>
              <Tooltip content={tooltip} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="w-full min-w-0 flex-1 divide-y divide-line text-sm">
          {slices.map((s, i) => (
            <li key={s.name} className="flex items-center gap-2.5 py-2">
              <span className="size-2 shrink-0 rounded-full" style={{ background: colorOf(s.name, i) }} aria-hidden />
              <span className="min-w-0 flex-1 truncate text-[var(--lume-text)]">{s.name}</span>
              <span className="tabular-nums text-[var(--lume-text)]">{format(s.value)}</span>
              <span className="w-12 text-right tabular-nums text-xs text-[var(--lume-text-muted)]">
                {total > 0 ? `${Math.round((s.value / total) * 100)}%` : '–'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
