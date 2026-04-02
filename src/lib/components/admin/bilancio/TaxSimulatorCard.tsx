'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { formatCurrency } from '@/lib/utils/format';

interface TaxSimulatorCardProps {
  gross: number;
  taxRate: number;
  onTaxRateChange: (rate: number) => void;
  tax: number;
  net: number;
}

export function TaxSimulatorCard({ gross, taxRate, onTaxRateChange, tax, net }: TaxSimulatorCardProps) {
  return (
    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 ring-0 border">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Simulatore Fiscale e INPS
        </CardTitle>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Regimi forfettari tipici: 5% (primo anno) · 15% · 27% (IRPEF + INPS)
        </p>
      </CardHeader>
      <CardContent className="space-y-5 pb-5">
        {/* Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Aliquota stimata</span>
            <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {taxRate}%
            </span>
          </div>
          <Slider
            min={0}
            max={60}
            step={1}
            value={[taxRate]}
            onValueChange={(values) => {
              const v = Array.isArray(values) ? values[0] : values;
              onTaxRateChange(v);
            }}
          />
        </div>

        {/* Breakdown */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Lordo</span>
            <span className="text-sm font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
              {formatCurrency(gross)}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Tasse ({taxRate}%)
            </span>
            <span className="text-sm font-medium tabular-nums text-red-400">
              − {formatCurrency(tax)}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Utile Netto</span>
            <span className={`text-sm font-semibold tabular-nums ${net >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              = {formatCurrency(net)}
            </span>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-zinc-400 dark:text-zinc-600 italic leading-relaxed">
          Nota: Questa stima assume un Regime Forfettario (senza scorporo IVA). Il calcolo è puramente indicativo.
        </p>
      </CardContent>
    </Card>
  );
}
