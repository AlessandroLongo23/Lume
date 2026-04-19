'use client';

import { useRef, useEffect, useState } from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';

export interface FacetedFilterOption {
  value: string;
  label: string;
  prefix?: React.ReactNode;
}

interface FacetedFilterProps {
  label: string;
  options: FacetedFilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function FacetedFilter({ label, options, selected, onChange }: FacetedFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={[
          'flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors',
          selected.length > 0
            ? 'bg-primary/10 border-primary/30 text-primary-hover dark:text-primary/70'
            : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
        ].join(' ')}
      >
        <SlidersHorizontal className="size-4" />
        <span>{label}</span>
        {selected.length > 0 && (
          <span className="bg-primary text-white text-xs rounded-full px-1.5 py-0.5 leading-none font-medium">
            {selected.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-20 w-52 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</span>
          </div>
          <div className="py-1 max-h-56 overflow-y-auto">
            {options.length === 0 ? (
              <p className="px-3 py-2 text-xs text-zinc-400">Nessuna opzione</p>
            ) : (
              options.map((opt) => {
                const checked = selected.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggle(opt.value)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <span
                      className={[
                        'shrink-0 size-4 rounded border transition-colors flex items-center justify-center',
                        checked ? 'bg-primary border-primary' : 'border-zinc-300 dark:border-zinc-600',
                      ].join(' ')}
                    >
                      {checked && <Check className="size-3 text-white" />}
                    </span>
                    {opt.prefix}
                    {opt.label}
                  </button>
                );
              })
            )}
          </div>
          {selected.length > 0 && (
            <div className="px-3 py-1.5 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => onChange([])}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                Azzera filtri
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
