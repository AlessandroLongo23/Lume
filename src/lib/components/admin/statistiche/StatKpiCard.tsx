import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatKpiCardProps {
  label: string;
  displayValue: string;
  icon: LucideIcon;
  trend?: number | null;
  trendLabel?: string;
}

export function StatKpiCard({ label, displayValue, icon: Icon, trend, trendLabel }: StatKpiCardProps) {
  const hasTrend = trend !== null && trend !== undefined;
  const isUp = hasTrend && trend! > 0;
  const isDown = hasTrend && trend! < 0;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{label}</p>
        <div className="rounded-md bg-zinc-100 dark:bg-zinc-800 p-1.5">
          <Icon className="size-4 text-zinc-500 dark:text-zinc-400" />
        </div>
      </div>
      <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{displayValue}</p>
      {hasTrend && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 flex items-center gap-1">
          <span className={`inline-flex items-center gap-0.5 font-medium ${isUp ? 'text-emerald-500' : isDown ? 'text-red-400' : 'text-zinc-400'}`}>
            {isUp && <TrendingUp className="size-3" />}
            {isDown && <TrendingDown className="size-3" />}
            {isUp ? '+' : ''}{trend!.toFixed(1)}%
          </span>
          {trendLabel && <span>{trendLabel}</span>}
        </p>
      )}
    </div>
  );
}
