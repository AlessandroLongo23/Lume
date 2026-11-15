'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { MapPin, X } from 'lucide-react';
import { Portal } from './Portal';
import { Field } from './forms/Field';
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
  value:    ComuneSelection | null;
  onChange: (c: ComuneSelection | null) => void;
  label?:   string;
}

/**
 * Pick an Italian comune by typing its name, laid out by <Field> on the shared
 * `control` surface. The chosen comune's province and region show as the hint.
 */
export function ComuneAutocomplete({ value, onChange, label }: ComuneAutocompleteProps) {
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

  const hint = value && (
    <span className="flex items-center gap-1.5">
      <span className="rounded-sm bg-active px-1.5 py-0.5 tabular-nums font-medium text-[var(--lume-text-secondary)]">{value.province}</span>
      <span aria-hidden>·</span>
      <span>{value.region}</span>
    </span>
  );

  return (
    <Field label={label} hint={hint}>
      {({ id, describedBy }) => (
        <>
          <div className="relative">
            <MapPin aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--lume-text-muted)]" />
            <input
              ref={inputRef}
              id={id}
              type="text"
              autoComplete="off"
              value={query}
              placeholder="Inizia a scrivere il comune…"
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
                setHighlighted(0);
                if (value && e.target.value !== value.city) onChange(null);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              role="combobox"
              aria-invalid={isStale || undefined}
              aria-describedby={describedBy}
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls={`${id}-listbox`}
              className="control control-md w-full pl-9 pr-9"
            />
            {query && (
              <button
                type="button"
                onClick={clear}
                tabIndex={-1}
                aria-label="Cancella comune"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--lume-text-muted)] transition-colors hover:text-[var(--lume-text)]"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {open && position && matches.length > 0 && (
            <Portal>
              <div
                ref={dropdownRef}
                id={`${id}-listbox`}
                role="listbox"
                className="surface-float fixed z-dropdown max-h-72 overflow-y-auto overscroll-contain p-1"
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
                        'flex h-9 w-full items-center justify-between gap-3 rounded-md px-2.5 text-left text-sm transition-colors duration-[var(--duration-fast)] pointer-coarse:h-11',
                        active ? 'bg-active' : 'hover:bg-hover',
                      )}
                    >
                      <span className="truncate">{c.nome}</span>
                      <span className="flex shrink-0 items-center gap-1.5 text-xs text-[var(--lume-text-secondary)]">
                        <span className="tabular-nums font-medium">{c.sigla}</span>
                        <span className="max-w-32 truncate">{c.regione}</span>
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
                className="surface-float fixed z-dropdown p-3 text-sm text-[var(--lume-text-secondary)]"
                style={{ top: position.top, left: position.left, width: position.width }}
              >
                Nessun comune corrispondente.
              </div>
            </Portal>
          )}
        </>
      )}
    </Field>
  );
}
