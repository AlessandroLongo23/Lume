'use client';

import { Slider } from '@/components/ui/slider';
import { formatCurrency } from '@/lib/utils/format';

interface TaxSimulatorCardProps {
  /** Profit without VAT, after costs: the base of the estimate. */
  utile: number;
  taxRate: number;
  onTaxRateChange: (rate: number) => void;
}

export function TaxSimulatorCard({ utile, taxRate, onTaxRateChange }: TaxSimulatorCardProps) {
  const tasse = utile > 0 ? utile * (taxRate / 100) : 0;
  const resta = utile - tasse;

  return (
    <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-5">
      <div>
        <h3 className="text-base font-semibold text-foreground">Stima delle tasse</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Calcolata sull&apos;utile senza IVA, al netto delle spese.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Aliquota stimata</span>
          <span className="text-sm font-semibold tabular-nums text-foreground">{taxRate}%</span>
        </div>
        <Slider
          min={0}
          max={60}
          step={1}
          value={[taxRate]}
          aria-label="Aliquota stimata"
          onValueChange={(values) => onTaxRateChange(Array.isArray(values) ? values[0] : values)}
        />
      </div>

      <dl className="flex flex-col divide-y divide-border rounded-md border border-border text-sm">
        <div className="flex items-center justify-between px-4 py-2.5">
          <dt className="text-muted-foreground">Utile</dt>
          <dd className="font-mono tabular-nums text-foreground">{formatCurrency(utile)}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5">
          <dt className="text-muted-foreground">Tasse stimate ({taxRate}%)</dt>
          <dd className="font-mono tabular-nums text-foreground">− {formatCurrency(tasse)}</dd>
        </div>
      </dl>

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Ti resta</span>
        <span className={`font-mono text-lg font-semibold tabular-nums ${resta < 0 ? 'text-danger-strong' : 'text-foreground'}`}>
          {formatCurrency(resta)}
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        È una stima indicativa: il calcolo esatto dipende dalla tua situazione fiscale completa.
      </p>
    </div>
  );
}
