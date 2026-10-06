'use client';

import { useId, useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import {
  Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Button } from '@/lib/components/shared/ui/Button';
import { DateField } from '@/lib/components/shared/ui/forms/DateField';

/** Shown in the list only while a typed range is the active period. */
export const CUSTOM_PERIOD = 'personalizzato';
const CUSTOM_LABEL = 'Periodo personalizzato';

export type YearPeriod = `anno_${number}`;

interface PeriodControlProps {
  /** Quick periods, in list order. */
  presets: { value: string; label: string }[];
  /** Whole calendar years listed under "Anni precedenti", newest first; picked as `anno_YYYY`. */
  pastYears: number[];
  /** The active period: a preset value, `anno_YYYY`, or CUSTOM_PERIOD. */
  preset: string;
  /** The period on screen, `yyyy-MM-dd`. */
  dal: string;
  al: string;
  isLoading: boolean;
  onPreset: (value: string) => void;
  /** A typed range, confirmed with "Applica" or Enter. */
  onApply: (dal: string, al: string) => void;
  /** `row` for a page toolbar, `stack` for a narrow sidebar. */
  layout?: 'row' | 'stack';
}

/**
 * Period picker shared by Bilancio and Statistiche. A quick period loads at once;
 * dates typed in "Dal / Al" are a draft until "Applica", so one period means one
 * request however many keys it took to write it.
 */
export function PeriodControl({
  presets, pastYears, preset, dal, al, isLoading, onPreset, onApply, layout = 'row',
}: PeriodControlProps) {
  const ids = useId();
  const [draft, setDraft] = useState({ dal, al, of: `${dal}|${al}` });
  // A new period landed from outside (quick period, apply): the draft restarts from it.
  if (draft.of !== `${dal}|${al}`) setDraft({ dal, al, of: `${dal}|${al}` });

  const complete = draft.dal !== '' && draft.al !== '';
  const reversed = complete && draft.dal > draft.al;
  const dirty = draft.dal !== dal || draft.al !== al;
  const canApply = complete && !reversed && dirty && !isLoading;
  const apply = () => {
    if (canApply) onApply(draft.dal, draft.al);
  };

  const stack = layout === 'stack';
  const size = stack ? 'sm' : 'md';
  const controlHeight = stack ? 'data-[size=default]:h-[var(--lume-control-h-sm)]' : 'data-[size=default]:h-[var(--lume-control-h-md)]';
  const items = {
    ...Object.fromEntries(presets.map((p) => [p.value, p.label])),
    ...Object.fromEntries(pastYears.map((y) => [`anno_${y}`, String(y)])),
    [CUSTOM_PERIOD]: CUSTOM_LABEL,
  };

  return (
    <div className={cn('flex gap-3', stack ? 'flex-col' : 'flex-wrap items-end')}>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${ids}-periodo`} className="text-xs text-muted-foreground">Periodo</label>
        <Select
          value={preset}
          onValueChange={(v) => {
            if (v && v !== CUSTOM_PERIOD) onPreset(v);
          }}
          items={items}
        >
          <SelectTrigger
            id={`${ids}-periodo`}
            className={cn('rounded-md border-border bg-card', controlHeight, stack ? 'w-full text-[length:var(--lume-control-text-sm)]' : 'w-52')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            {presets.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
            {preset === CUSTOM_PERIOD && <SelectItem value={CUSTOM_PERIOD}>{CUSTOM_LABEL}</SelectItem>}
            {pastYears.length > 0 && (
              <>
                <SelectSeparator />
                <SelectGroup className="p-0">
                  <SelectLabel>Anni precedenti</SelectLabel>
                  {pastYears.map((y) => (
                    <SelectItem key={y} value={`anno_${y}`}>{y}</SelectItem>
                  ))}
                </SelectGroup>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className={cn('flex gap-3', stack ? 'flex-col' : 'items-end')}>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${ids}-dal`} className="text-xs text-muted-foreground">Dal</label>
          <DateField
            id={`${ids}-dal`}
            size={size}
            value={draft.dal}
            onChange={(v) => setDraft((d) => ({ ...d, dal: v }))}
            onEnter={apply}
            className={stack ? 'w-full' : 'w-40'}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${ids}-al`} className="text-xs text-muted-foreground">Al</label>
          <DateField
            id={`${ids}-al`}
            size={size}
            value={draft.al}
            onChange={(v) => setDraft((d) => ({ ...d, al: v }))}
            onEnter={apply}
            className={stack ? 'w-full' : 'w-40'}
          />
        </div>
        <Button
          variant={dirty ? 'primary' : 'secondary'}
          size={size}
          leadingIcon={Check}
          loading={isLoading}
          disabled={!canApply}
          fullWidth={stack}
          onClick={apply}
        >
          Applica
        </Button>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={cn('flex items-center gap-1.5 text-xs', stack ? 'min-h-4' : 'h-[var(--lume-control-h-md)]', reversed ? 'text-danger-strong' : 'text-muted-foreground')}
      >
        {reversed ? (
          <>
            <AlertCircle className="size-3.5 shrink-0" aria-hidden />
            La data iniziale viene dopo quella finale.
          </>
        ) : isLoading ? (
          'Aggiornamento in corso…'
        ) : null}
      </p>
    </div>
  );
}
