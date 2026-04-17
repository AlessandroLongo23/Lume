'use client';

import { useState, useMemo } from 'react';
import { Search, Check, Scissors } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/services';

interface ServicesMultiSelectProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxHeight?: string;
}

export function ServicesMultiSelect({
  selectedIds,
  onChange,
  maxHeight = 'max-h-48',
}: ServicesMultiSelectProps) {
  const services = useServicesStore((s) => s.services).filter((s) => !s.isArchived);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? services.filter((s) => s.name.toLowerCase().includes(q)) : services;
  }, [services, query]);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          placeholder="Cerca servizi…"
        />
      </div>
      <div className={`${maxHeight} overflow-y-auto rounded-md border border-zinc-500/15 divide-y divide-zinc-500/10`}>
        {filtered.length === 0 ? (
          <p className="p-3 text-xs text-zinc-400 text-center">Nessun servizio</p>
        ) : (
          filtered.map((s) => {
            const isSelected = selectedIds.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm text-left transition-colors ${
                  isSelected
                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Scissors className="size-3.5 shrink-0 text-zinc-400" />
                  <span className="truncate">{s.name}</span>
                  <span className="ml-2 text-xs text-zinc-400">€ {s.price.toFixed(2)}</span>
                </span>
                {isSelected && <Check className="size-3.5 shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
