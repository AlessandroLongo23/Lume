'use client';

import { useMemo, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';
import {
  PROSPECT_STATUSES,
  STATUS_LABEL,
  STATUS_TONE,
  type ProspectStatus,
  Prospect,
} from '@/lib/types/Prospect';

const TONE_DOT: Record<(typeof STATUS_TONE)[ProspectStatus], string> = {
  neutral: 'bg-muted-foreground',
  muted:   'bg-muted-foreground/60',
  warning: 'bg-[var(--lume-warning-fg)]',
  danger:  'bg-[var(--lume-danger-fg)]',
  success: 'bg-[var(--lume-success-fg)]',
  accent:  'bg-[var(--lume-accent)]',
};

export type ProspectFiltersValue = {
  query:    string;
  statuses: ProspectStatus[];
  region:   string | null;
};

export const EMPTY_FILTERS: ProspectFiltersValue = {
  query: '', statuses: [], region: null,
};

interface ProspectFiltersProps {
  value:     ProspectFiltersValue;
  onChange:  (v: ProspectFiltersValue) => void;
  prospects: Prospect[];
  trailing?: ReactNode;
}

export function ProspectFilters({ value, onChange, prospects, trailing }: ProspectFiltersProps) {
  const regionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of prospects) if (p.region) set.add(p.region);
    return [...set]
      .sort((a, b) => a.localeCompare(b, 'it'))
      .map((r) => ({ label: r, value: r }));
  }, [prospects]);

  const toggleStatus = (s: ProspectStatus) => {
    const has = value.statuses.includes(s);
    onChange({
      ...value,
      statuses: has ? value.statuses.filter((x) => x !== s) : [...value.statuses, s],
    });
  };

  const reset = () => onChange(EMPTY_FILTERS);
  const hasActive = value.query.trim() || value.statuses.length > 0 || value.region;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex items-center flex-1 min-w-[12rem] max-w-sm">
          <Search className="absolute left-2.5 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Cerca per nome, telefono, note…"
            value={value.query}
            onChange={(e) => onChange({ ...value, query: e.target.value })}
            className="w-full py-2 pl-9 pr-8 text-sm bg-card text-foreground placeholder:text-muted-foreground border border-input rounded-lg focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none transition-[border-color,box-shadow]"
          />
          {value.query && (
            <button
              onClick={() => onChange({ ...value, query: '' })}
              className="absolute right-2 p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
              aria-label="Cancella ricerca"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <CustomSelect
          value={value.region}
          onChange={(v) => onChange({ ...value, region: (v as string | null) ?? null })}
          options={regionOptions}
          labelKey="label"
          valueKey="value"
          placeholder="Tutte le regioni"
          isNullable
          width="w-56"
        />

        {hasActive && (
          <button
            onClick={reset}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Azzera filtri
          </button>
        )}

        {trailing && <div className="ml-auto">{trailing}</div>}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PROSPECT_STATUSES.map((s) => {
          const active = value.statuses.includes(s);
          return (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                active
                  ? 'border-border bg-muted text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted/50',
              )}
              aria-pressed={active}
            >
              <span className={cn('size-1.5 rounded-full', TONE_DOT[STATUS_TONE[s]])} />
              {STATUS_LABEL[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function applyProspectFilters(prospects: Prospect[], filters: ProspectFiltersValue): Prospect[] {
  let data = prospects;
  if (filters.statuses.length > 0) {
    data = data.filter((p) => filters.statuses.includes(p.status));
  }
  if (filters.region) {
    data = data.filter((p) => p.region === filters.region);
  }
  if (filters.query.trim()) {
    const q = filters.query.toLowerCase().trim();
    data = data.filter((p) =>
      p.name.toLowerCase().includes(q)
      || (p.phone_shop ?? '').toLowerCase().includes(q)
      || (p.phone_personal ?? '').toLowerCase().includes(q)
      || (p.owner_name ?? '').toLowerCase().includes(q)
      || (p.notes ?? '').toLowerCase().includes(q)
      || (p.city ?? '').toLowerCase().includes(q)
    );
  }
  return data;
}
