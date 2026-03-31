'use client';

import type { FilterChoice } from '@/lib/types/dataColumn';

interface SelectFilterProps {
  options?: FilterChoice[];
  value?: string | number | null;
  onChange: (v: string | number | null) => void;
}

export function SelectFilter({ options = [], value = null, onChange }: SelectFilterProps) {
  return (
    <div className="flex flex-col gap-2 min-w-56">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Seleziona</span>
        <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline" onClick={() => onChange(null)}>Pulisci</button>
      </div>
      <select
        className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-sm"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">Tutte</option>
        {options.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
