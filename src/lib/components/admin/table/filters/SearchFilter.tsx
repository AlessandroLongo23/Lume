'use client';

interface SearchFilterProps {
  value?: string;
  placeholder?: string;
  onChange: (v: string) => void;
}

export function SearchFilter({ value = '', placeholder = 'Cerca...', onChange }: SearchFilterProps) {
  return (
    <div className="flex flex-col gap-2 min-w-56">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Ricerca</span>
        <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline" onClick={() => onChange('')}>Pulisci</button>
      </div>
      <input
        className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-sm"
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
