'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchStore } from '@/lib/stores/search';

type ControlSize = 'sm' | 'md' | 'lg';

interface SearchbarProps {
  placeholder?: string;
  isNullable?: boolean;
  className?: string;
  size?: ControlSize;
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

const sizeClasses: Record<ControlSize, string> = {
  sm: 'h-[var(--lume-control-h-sm)] text-[length:var(--lume-control-text-sm)]',
  md: 'h-[var(--lume-control-h-md)] text-[length:var(--lume-control-text-md)]',
  lg: 'h-[var(--lume-control-h-lg)] text-[length:var(--lume-control-text-lg)]',
};

export function Searchbar({
  placeholder = 'Cerca...',
  isNullable = true,
  className = '',
  size = 'md',
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
    <div className={`relative flex items-center ${className}`}>
      <div className="absolute left-2.5 text-[var(--lume-text-muted)] pointer-events-none">
        <Search className="size-4" />
      </div>

      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={[
          'w-full pl-9 pr-8 bg-transparent border rounded-lg outline-none',
          'border-[var(--lume-border)] text-[var(--lume-text)] placeholder:text-[var(--lume-text-muted)]',
          'focus:border-[var(--lume-ring-focus)]',
          'transition-colors duration-[var(--duration-base)] ease-[var(--ease-in-out)]',
          sizeClasses[size],
        ].join(' ')}
      />

      {query && isNullable && (
        <button
          type="button"
          className="absolute right-2 p-1 text-[var(--lume-text-muted)] hover:text-[var(--lume-text)] rounded-md transition-colors"
          onClick={clear}
          aria-label="Cancella ricerca"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
