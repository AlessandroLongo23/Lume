'use client';

import {
  Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectValue,
} from '@/components/ui/select';
import { BILANCIO_PRESETS, useBilancioStore, type BilancioPreset } from '@/lib/stores/bilancio';
import { usePastYears } from '@/lib/hooks/usePastYears';

const PRESET_ITEMS = Object.fromEntries(BILANCIO_PRESETS.map((p) => [p.value, p.label]));

const dateInputClass =
  'h-[var(--lume-control-h-md)] rounded-md border border-border bg-card px-3 text-sm text-foreground ' +
  'tabular-nums focus:outline-none focus:border-primary';

/**
 * Quick periods plus "Dal / Al": editing a date switches to "Periodo personalizzato".
 * The years before "Anno scorso" are listed one by one, as far back as the salon has fiches.
 */
export function BilancioPeriodControl() {
  const preset = useBilancioStore((s) => s.preset);
  const dal = useBilancioStore((s) => s.dal);
  const al = useBilancioStore((s) => s.al);
  const setPreset = useBilancioStore((s) => s.setPreset);
  const setRange = useBilancioStore((s) => s.setRange);
  const pastYears = usePastYears(new Date().getFullYear() - 2);
  const items = { ...PRESET_ITEMS, ...Object.fromEntries(pastYears.map((y) => [`anno_${y}`, String(y)])) };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Periodo</span>
        <Select
          value={preset}
          onValueChange={(v) => {
            if (v && v !== 'personalizzato') setPreset(v as Exclude<BilancioPreset, 'personalizzato'>);
          }}
          items={items}
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
            {pastYears.length > 0 && (
              <>
                <SelectSeparator />
                <SelectGroup className="p-0">
                  <SelectLabel>Anni precedenti</SelectLabel>
                  {pastYears.map((y) => (
                    <SelectItem key={y} value={`anno_${y}`}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </>
            )}
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
