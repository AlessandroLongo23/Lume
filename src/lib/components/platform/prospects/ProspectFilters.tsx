'use client';

import { useMemo, type ReactNode } from 'react';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';
import { Button } from '@/lib/components/shared/ui/Button';
import { ProspectStatusChip } from './ProspectStatusChip';
import {
  PROSPECT_STATUSES,
  type ProspectStatus,
  Prospect,
} from '@/lib/types/Prospect';

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
        <Searchbar
          placeholder="Cerca per nome, telefono, note…"
          value={value.query}
          onChange={(q) => onChange({ ...value, query: q })}
          className="flex-1 min-w-48 max-w-sm"
        />

        <Select
          value={value.region}
          onChange={(v) => onChange({ ...value, region: (v as string | null) ?? null })}
          options={regionOptions}
          labelKey="label"
          valueKey="value"
          placeholder="Tutte le regioni"
          isNullable
          className="w-56"
        />

        {hasActive && (
          <Button variant="ghost" onClick={reset}>
            Azzera filtri
          </Button>
        )}

        {trailing && <div className="ml-auto">{trailing}</div>}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PROSPECT_STATUSES.map((s) => {
          const active = value.statuses.includes(s);
          return (
            <Button
              key={s}
              variant="secondary"
              size="sm"
              onClick={() => toggleStatus(s)}
              pressed={active}
              className="max-md:h-11"
            >
              <ProspectStatusChip status={s} className="font-[inherit]" />
            </Button>
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
