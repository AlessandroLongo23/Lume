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
    <div className="surface-card p-6 flex flex-col gap-5">
      <div>
        <h3 className="text-base font-medium tracking-tight text-[var(--lume-text)]">Stima delle tasse</h3>
        <p className="text-sm text-[var(--lume-text-secondary)] mt-1">
          Calcolata sull&apos;utile senza IVA, al netto delle spese.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--lume-text-secondary)]">Aliquota stimata</span>
          <span className="text-sm tabular-nums text-[var(--lume-text)]">{taxRate}%</span>
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

      <dl className="flex flex-col divide-y divide-line border-y border-line text-sm">
        <div className="flex items-center justify-between py-2.5">
          <dt className="text-[var(--lume-text-secondary)]">Utile</dt>
          <dd className="tabular-nums text-[var(--lume-text)]">{formatCurrency(utile)}</dd>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <dt className="text-[var(--lume-text-secondary)]">Tasse stimate ({taxRate}%)</dt>
          <dd className="tabular-nums text-[var(--lume-text)]">− {formatCurrency(tasse)}</dd>
        </div>
      </dl>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--lume-text)]">Ti resta</span>
        <span className={`tabular-nums text-2xl font-normal tracking-tight ${resta < 0 ? 'text-danger-strong' : 'text-[var(--lume-text)]'}`}>
          {formatCurrency(resta)}
        </span>
      </div>

      <p className="text-xs text-[var(--lume-text-muted)] leading-relaxed">
        È una stima indicativa: il calcolo esatto dipende dalla tua situazione fiscale completa.
      </p>
    </div>
  );
}
