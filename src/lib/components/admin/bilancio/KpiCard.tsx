import type { ReactNode } from 'react';
import { formatCurrency } from '@/lib/utils/format';
import { Stat, Trend } from '@/lib/components/shared/ui/StatRow';

interface KpiCardProps {
  label: string;
  /** Amount without VAT: the headline figure. */
  netto: number;
  /** Same amount with VAT, shown underneath. */
  lordo: number;
  /** Ties the figure to its chart series (a coloured dot). */
  marker?: ReactNode;
  /** Change vs the comparison period, in percent. null hides it. */
  trend?: number | null;
  /** For costs a rise is bad news: flips the colour of the trend. */
  higherIsWorse?: boolean;
}

/** One figure of the Bilancio headline row: net amount big, VAT-inclusive line muted. */
export function KpiCard({ label, netto, lordo, marker, trend = null, higherIsWorse = false }: KpiCardProps) {
  return (
    <Stat label={label} value={formatCurrency(netto)} marker={marker} negative={netto < 0}>
      <span>
        Con IVA <span className="tabular-nums">{formatCurrency(lordo)}</span>
      </span>
      {trend !== null && (
        <Trend value={trend} higherIsWorse={higherIsWorse} suffix="rispetto al periodo di confronto" />
      )}
    </Stat>
  );
}
