'use client';

import { useStatisticheStore, type Preset } from '@/lib/stores/statistiche';

const PRESETS: { value: Preset; label: string }[] = [
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

  function handleFromChange(e: React.ChangeEvent<HTMLInputElement>) {
    const d = new Date(e.target.value);
    if (!isNaN(d.getTime())) {
      setDateFrom(d);
      fetchForPeriod(d, dateTo);
    }
  }

  function handleToChange(e: React.ChangeEvent<HTMLInputElement>) {
    const d = new Date(e.target.value);
    if (!isNaN(d.getTime())) {
      setDateTo(d);
      fetchForPeriod(dateFrom, d);
    }
  }

  function toInputValue(d: Date) {
    return d.toISOString().slice(0, 10);
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
    </div>
  );
}
