import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className="rounded-md bg-zinc-100 dark:bg-zinc-800 p-1.5">
          <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        </div>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold tabular-nums ${valueColor}`}>
          {formatCurrency(value)}
        </p>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            <span className={`inline-flex items-center gap-1 ${trendUp ? 'text-emerald-500' : 'text-red-400'}`}>
              {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend}
            </span>
            {' '}vs periodo prec.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
