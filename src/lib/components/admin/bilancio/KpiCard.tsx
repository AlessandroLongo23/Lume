import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

interface KpiCardProps {
  label: string;
  /** Amount without VAT: the headline figure. */
  netto: number;
  /** Same amount with VAT, shown underneath. */
  lordo: number;
  icon: LucideIcon;
  /** Change vs the comparison period, in percent. null hides it. */
  trend?: number | null;
  /** For costs a rise is bad news: flips the colour of the trend. */
  higherIsWorse?: boolean;
}

export function KpiCard({ label, netto, lordo, icon: Icon, trend = null, higherIsWorse = false }: KpiCardProps) {
  const good = trend === null ? null : (trend >= 0) !== higherIsWorse;

  return (
    <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="rounded-md bg-muted p-1.5">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <p className={`font-mono text-2xl font-semibold tabular-nums ${netto < 0 ? 'text-danger-strong' : 'text-foreground'}`}>
          {formatCurrency(netto)}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          Con IVA: <span className="font-mono">{formatCurrency(lordo)}</span>
        </p>
      </div>
      {trend !== null && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 font-medium ${good ? 'text-success-strong' : 'text-danger-strong'}`}>
            {trend >= 0 ? <TrendingUp className="size-3.5" aria-hidden /> : <TrendingDown className="size-3.5" aria-hidden />}
            {trend >= 0 ? '+' : '−'}{Math.abs(trend).toLocaleString('it-IT', { maximumFractionDigits: 1 })}%
          </span>
          rispetto al periodo di confronto
        </p>
      )}
    </div>
  );
}
