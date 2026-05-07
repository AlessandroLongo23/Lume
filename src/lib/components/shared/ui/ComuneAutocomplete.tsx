'use client';

import { useState, useMemo, useRef, useEffect, useCallback, useId } from 'react';
import { MapPin, X, AlertCircle } from 'lucide-react';
import { Portal } from './Portal';
import { cn } from '@/lib/utils';

type ComuneRecord = {
  codice:    string;
  nome:      string;
  sigla:     string;
  provincia: string;
  regione:   string;
};

export type ComuneSelection = {
  comune_code: string;
  city:        string;
  province:    string;
  region:      string;
};

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

let cachedComuni: ComuneRecord[] | null = null;
let cachePromise: Promise<ComuneRecord[]> | null = null;

function loadComuni(): Promise<ComuneRecord[]> {
  if (cachedComuni) return Promise.resolve(cachedComuni);
  if (cachePromise) return cachePromise;
  cachePromise = import('@/lib/data/comuni.json').then((mod) => {
    cachedComuni = mod.default as ComuneRecord[];
    return cachedComuni;
  });
  return cachePromise;
}

interface ComuneAutocompleteProps {
  value:        ComuneSelection | null;
  onChange:     (c: ComuneSelection | null) => void;
  label?:       string;
  placeholder?: string;
  error?:       string;
  required?:    boolean;
  disabled?:    boolean;
}

export function ComuneAutocomplete({
  value,
  onChange,
  label,
  placeholder = 'Inizia a scrivere il comune…',
  error,
  required,
  disabled,
}: ComuneAutocompleteProps) {
  const id = useId();
  const inputRef    = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [comuni, setComuni]           = useState<ComuneRecord[]>([]);
  const [query, setQuery]             = useState(value?.city ?? '');
  const [open, setOpen]               = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [position, setPosition]       = useState<{ top: number; left: number; width: number } | null>(null);

  // Lazy-load the dataset once
  useEffect(() => {
    loadComuni().then(setComuni);
  }, []);

  // Sync displayed text when value changes externally (e.g., reset)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(value?.city ?? '');
  }, [value?.city, value?.comune_code]);

  const matches = useMemo(() => {
    const q = normalize(query.trim());
    if (!q || comuni.length === 0) return [];
    return comuni.filter((c) => normalize(c.nome).includes(q)).slice(0, 50);
  }, [query, comuni]);

  const updatePosition = useCallback(() => {
    if (!inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    setPosition({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  // Compute dropdown position when opening; close on resize/scroll
  useEffect(() => {
    if (!open) return;
    updatePosition();
    const close = () => setOpen(false);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open, updatePosition]);

  // Outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (inputRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Keep highlighted index inside matches range
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (highlighted >= matches.length) setHighlighted(0);
  }, [matches.length, highlighted]);

  const select = (c: ComuneRecord) => {
    onChange({
      comune_code: c.codice,
      city:        c.nome,
      province:    c.sigla,
      region:      c.regione,
    });
    setQuery(c.nome);
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setQuery('');
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlighted((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const c = matches[highlighted];
      if (c) select(c);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const isStale = !!value && value.city !== query;

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <MapPin className="size-4" />
        </div>
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlighted(0);
            if (value && e.target.value !== value.city) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-invalid={!!error || undefined}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          className={cn(
            'w-full rounded-md border bg-card text-foreground placeholder:text-muted-foreground',
            'h-[var(--lume-control-h-md)] pl-9 pr-9 text-[length:var(--lume-control-text-md)]',
            'transition-[border-color,box-shadow] duration-200',
            'focus:outline-none focus:ring-2 focus:ring-ring/20',
            error || isStale
              ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
              : 'border-input focus:border-ring',
            disabled && 'opacity-50 cursor-not-allowed bg-muted',
          )}
        />
        {query && !disabled && (
          <button
            type="button"
            onClick={clear}
            tabIndex={-1}
            aria-label="Cancella comune"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {value && (
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-muted font-medium">{value.province}</span>
          <span>·</span>
          <span>{value.region}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm" role="alert">
          <AlertCircle className="size-4 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {open && position && matches.length > 0 && (
        <Portal>
          <div
            ref={dropdownRef}
            id={`${id}-listbox`}
            role="listbox"
            className="fixed z-dropdown bg-popover text-popover-foreground border border-border rounded-lg shadow-lg max-h-72 overflow-y-auto py-1"
            style={{ top: position.top, left: position.left, width: position.width }}
          >
            {matches.map((c, idx) => {
              const active = idx === highlighted;
              return (
                <button
                  key={c.codice}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setHighlighted(idx)}
                  onMouseDown={(e) => { e.preventDefault(); select(c); }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-3 transition-colors',
                    active ? 'bg-muted' : 'hover:bg-muted/60',
                  )}
                >
                  <span className="font-medium truncate">{c.nome}</span>
                  <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-muted/80 font-medium">{c.sigla}</span>
                    <span className="truncate max-w-[8rem]">{c.regione}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Portal>
      )}

      {open && position && query.trim() && matches.length === 0 && comuni.length > 0 && (
        <Portal>
          <div
            className="fixed z-dropdown bg-popover text-popover-foreground border border-border rounded-lg shadow-lg p-3 text-sm text-muted-foreground"
            style={{ top: position.top, left: position.left, width: position.width }}
          >
            Nessun comune corrispondente.
          </div>
        </Portal>
      )}
    </div>
  );
}
