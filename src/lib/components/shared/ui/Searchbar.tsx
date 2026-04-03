'use client';

import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchStore } from '@/lib/stores/search';

interface SearchbarProps {
  placeholder?: string;
  isNullable?: boolean;
  className?: string;
}

export function Searchbar({ placeholder = 'Cerca...', isNullable = true, className = '' }: SearchbarProps) {
  const { query, setQuery, clear } = useSearchStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
  }, [clear]);

  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="absolute left-2 text-zinc-400">
        <Search className="size-5" />
      </div>

      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full py-2 pl-9 pr-8 text-sm bg-transparent border rounded-lg
          dark:border-zinc-800 border-zinc-200
          dark:focus:border-zinc-700 focus:border-zinc-300
          dark:text-zinc-100 text-zinc-900
          placeholder:text-zinc-400
          outline-none transition-all duration-200"
      />

      {query && isNullable && (
        <button
          className="absolute right-2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md transition-colors"
          onClick={clear}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
