import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/format';

interface KpiCardProps {
  label: string;
  value: number;
  accent?: 'green' | 'red';
  dimmed?: boolean;
  icon: LucideIcon;
  trend?: string | null;
  trendUp?: boolean;
}

export function KpiCard({ label, value, accent, dimmed, icon: Icon, trend, trendUp }: KpiCardProps) {
  const valueColor =
    accent === 'green' ? 'text-emerald-500' :
    accent === 'red'   ? 'text-red-500' :
    dimmed             ? 'text-zinc-400 dark:text-zinc-500' :
                         'text-zinc-900 dark:text-zinc-50';

  return (
    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 ring-0 border">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {label}
          </p>
          <div className="rounded-md bg-zinc-100 dark:bg-zinc-800 p-1.5">
            <Icon className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
          </div>
        </div>
        <p className={`text-2xl font-semibold tabular-nums ${valueColor}`}>
          {formatCurrency(value)}
        </p>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${trendUp ? 'text-emerald-500' : 'text-red-400'}`}>
            {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
