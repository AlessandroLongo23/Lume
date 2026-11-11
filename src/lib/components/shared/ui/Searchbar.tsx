'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchStore } from '@/lib/stores/search';
import { cn } from '@/lib/utils';

interface SearchbarProps {
  placeholder?: string;
  className?: string;
  /**
   * Controlled mode. When provided, the searchbar is decoupled from the
   * global useSearchStore and behaves as a plain controlled input. Pair
   * `value` with `onChange` to drive a local-state filter (e.g. a table
   * toolbar that lives alongside the cmd+K global search).
   */
  value?: string;
  onChange?: (value: string) => void;
  /** Bind cmd/ctrl+K to focus this searchbar. Default: only in store mode. */
  bindShortcut?: boolean;
}

export function Searchbar({
  placeholder = 'Cerca...',
  className,
  value,
  onChange,
  bindShortcut,
}: SearchbarProps) {
  const isControlled = value !== undefined && onChange !== undefined;
  const store = useSearchStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const query = isControlled ? value! : store.query;
  const setQuery = isControlled ? onChange! : store.setQuery;
  const storeClear = store.clear;
  const clear = useCallback(() => {
    if (isControlled) onChange!('');
    else storeClear();
  }, [isControlled, onChange, storeClear]);

  const shouldBindShortcut = bindShortcut ?? !isControlled;

  useEffect(() => {
    if (!shouldBindShortcut) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        clear();
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clear, shouldBindShortcut]);

  return (
    <div className={cn('relative flex items-center', className)}>
      <div className="absolute left-3 text-[var(--lume-text-muted)] pointer-events-none">
        <Search className="size-4" />
      </div>

      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        // The shared field surface; room for the icon and the clear button.
        className="control control-md w-full pl-9 pr-8"
      />

      {query && (
        <button
          type="button"
          className="absolute right-2 p-1 text-[var(--lume-text-muted)] hover:text-[var(--lume-text)] rounded-md transition-colors"
          onClick={clear}
          aria-label="Cancella ricerca"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
