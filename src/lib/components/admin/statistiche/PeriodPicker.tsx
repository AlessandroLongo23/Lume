'use client';

import { endOfDay, format, parseISO } from 'date-fns';
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@/components/ui/select';
import { useStatisticheStore, type QuickPreset, type YearPreset } from '@/lib/stores/statistiche';
import { usePastYears } from '@/lib/hooks/usePastYears';

const PRESETS: { value: QuickPreset; label: string }[] = [
  { value: '7d',    label: '7g' },
  { value: 'month', label: 'Mese' },
  { value: '3m',    label: '3m' },
  { value: 'year',  label: 'Anno' },
];

export function PeriodPicker() {
  const preset      = useStatisticheStore((s) => s.preset);
  const dateFrom    = useStatisticheStore((s) => s.dateFrom);
  const dateTo      = useStatisticheStore((s) => s.dateTo);
  const setPreset   = useStatisticheStore((s) => s.setPreset);
  const setDateFrom = useStatisticheStore((s) => s.setDateFrom);
  const setDateTo   = useStatisticheStore((s) => s.setDateTo);
  const fetchForPeriod = useStatisticheStore((s) => s.fetchForPeriod);
  // "Anno" covers the current year; the ones before it are picked from the list.
  const pastYears = usePastYears(new Date().getFullYear() - 1);
  const yearItems = Object.fromEntries(pastYears.map((y) => [`anno_${y}`, String(y)]));
  const selectedYear = preset.startsWith('anno_') ? preset : null;

  function handleFromChange(e: React.ChangeEvent<HTMLInputElement>) {
    const d = parseISO(e.target.value);
    if (!isNaN(d.getTime())) {
      setDateFrom(d);
      fetchForPeriod(d, dateTo);
    }
  }

  function handleToChange(e: React.ChangeEvent<HTMLInputElement>) {
    const d = endOfDay(parseISO(e.target.value));
    if (!isNaN(d.getTime())) {
      setDateTo(d);
      fetchForPeriod(dateFrom, d);
    }
  }

  function toInputValue(d: Date) {
    return format(d, 'yyyy-MM-dd');
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3 space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        Periodo
      </p>

      <div className="space-y-2">
        <div className="space-y-1">
          <label className="text-[11px] text-zinc-500">Dal</label>
          <input
            type="date"
            value={toInputValue(dateFrom)}
            onChange={handleFromChange}
            className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-zinc-500">Al</label>
          <input
            type="date"
            value={toInputValue(dateTo)}
            onChange={handleToChange}
            className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPreset(p.value)}
            className={`py-1 rounded text-[10px] font-semibold transition-colors ${
              preset === p.value
                ? 'bg-primary text-white'
                : 'border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {pastYears.length > 0 && (
        <Select
          value={selectedYear}
          onValueChange={(v) => {
            if (v) setPreset(v as YearPreset);
          }}
          items={yearItems}
        >
          <SelectTrigger
            aria-label="Anni precedenti"
            className="w-full rounded-md border-border bg-card text-xs text-foreground data-[size=default]:h-[var(--lume-control-h-sm)]"
          >
            <SelectValue placeholder="Anni precedenti" />
          </SelectTrigger>
          <SelectContent align="start">
            {pastYears.map((y) => (
              <SelectItem key={y} value={`anno_${y}`}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
