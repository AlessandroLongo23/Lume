'use client';

import { useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { Button } from '@/lib/components/shared/ui/Button';
import { DateField } from '@/lib/components/shared/ui/forms/DateField';

/** Shown in the list only while a typed range is the active period. */
export const CUSTOM_PERIOD = 'personalizzato';
const CUSTOM_LABEL = 'Periodo personalizzato';

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
  // Quick periods, the custom range while it is active, then past years under their own heading.
  const options: { value: string; label: string; group?: string }[] = [
    ...presets,
    ...(preset === CUSTOM_PERIOD ? [{ value: CUSTOM_PERIOD, label: CUSTOM_LABEL }] : []),
    ...pastYears.map((y) => ({ value: `anno_${y}`, label: String(y), group: 'Anni precedenti' })),
  ];

  return (
    <div className={cn('flex gap-3', stack ? 'flex-col' : 'flex-wrap items-end')}>
      <Field label="Periodo">
        {({ id }) => (
          <Select
            id={id}
            value={preset}
            onChange={(v: string) => {
              if (v && v !== CUSTOM_PERIOD) onPreset(v);
            }}
            options={options}
            labelKey="label"
            valueKey="value"
            groupBy={(o: { group?: string }) => o.group}
            renderValue={(o: { label: string; group?: string }) => (o.group ? `Anno ${o.label}` : o.label)}
            searchable={false}
            size={size}
            className={stack ? 'w-full' : 'w-52'}
          />
        )}
      </Field>

      <div className={cn('flex gap-3', stack ? 'flex-col' : 'flex-wrap items-end')}>
        <Field label="Dal">
          {({ id }) => (
            <DateField
              id={id}
              size={size}
              value={draft.dal}
              onChange={(v) => setDraft((d) => ({ ...d, dal: v }))}
              onEnter={apply}
              className={stack ? 'w-full' : 'w-40'}
            />
          )}
        </Field>
        <Field label="Al">
          {({ id }) => (
            <DateField
              id={id}
              size={size}
              value={draft.al}
              onChange={(v) => setDraft((d) => ({ ...d, al: v }))}
              onEnter={apply}
              className={stack ? 'w-full' : 'w-40'}
            />
          )}
        </Field>
        <Button
          variant={dirty ? 'primary' : 'secondary'}
          size={size}
          leadingIcon={Check}
          loading={isLoading}
          disabled={!canApply}
          className={stack ? 'w-full' : undefined}
          onClick={apply}
        >
          Applica
        </Button>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={cn('flex items-center gap-1.5 text-xs empty:hidden', stack ? 'min-h-4' : 'h-[var(--lume-control-h-md)]', reversed ? 'text-danger-strong' : 'text-[var(--lume-text-muted)]')}
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
