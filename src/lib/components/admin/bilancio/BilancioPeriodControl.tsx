'use client';

import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@/components/ui/select';
import { BILANCIO_PRESETS, useBilancioStore, type BilancioPreset } from '@/lib/stores/bilancio';

const PRESET_ITEMS = Object.fromEntries(BILANCIO_PRESETS.map((p) => [p.value, p.label]));

const dateInputClass =
  'h-[var(--lume-control-h-md)] rounded-md border border-border bg-card px-3 text-sm text-foreground ' +
  'tabular-nums focus:outline-none focus:border-primary';

/** Quick periods plus "Dal / Al": editing a date switches to "Periodo personalizzato". */
export function BilancioPeriodControl() {
  const preset = useBilancioStore((s) => s.preset);
  const dal = useBilancioStore((s) => s.dal);
  const al = useBilancioStore((s) => s.al);
  const setPreset = useBilancioStore((s) => s.setPreset);
  const setRange = useBilancioStore((s) => s.setRange);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Periodo</span>
        <Select
          value={preset}
          onValueChange={(v) => {
            if (v && v !== 'personalizzato') setPreset(v as Exclude<BilancioPreset, 'personalizzato'>);
          }}
          items={PRESET_ITEMS}
        >
          <SelectTrigger className="w-52 data-[size=default]:h-[var(--lume-control-h-md)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            {BILANCIO_PRESETS.filter((p) => p.value !== 'personalizzato' || preset === 'personalizzato').map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Dal</span>
        <input
          type="date"
          value={dal}
          max={al}
          onChange={(e) => setRange(e.target.value, al)}
          className={dateInputClass}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Al</span>
        <input
          type="date"
          value={al}
          min={dal}
          onChange={(e) => setRange(dal, e.target.value)}
          className={dateInputClass}
        />
      </label>
    </div>
  );
}
