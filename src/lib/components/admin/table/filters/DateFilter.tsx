'use client';

interface DateFilterProps {
  value?: { from: string; to: string };
  onChange: (v: { from: string; to: string }) => void;
}

export function DateFilter({ value = { from: '', to: '' }, onChange }: DateFilterProps) {
  return (
    <div className="flex flex-col gap-2 min-w-56">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Intervallo date</span>
        <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline" onClick={() => onChange({ from: '', to: '' })}>Pulisci</button>
      </div>
      <div className="flex gap-2 items-center">
        <input
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-sm"
          type="date"
          value={value.from}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
        />
        <span className="text-xs text-zinc-500">—</span>
        <input
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-sm"
          type="date"
          value={value.to}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
        />
      </div>
    </div>
  );
}
