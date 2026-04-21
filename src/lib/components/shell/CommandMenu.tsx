'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft, type LucideIcon } from 'lucide-react';

export function useCommandMenuController() {
  const [open, setOpen] = useState(false);
  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return { open, onOpen, onClose };
}

export type CommandItem =
  | { type: 'nav';    label: string; href: string; icon: LucideIcon; keywords?: string[]; group?: string }
  | { type: 'create'; label: string; href: string; icon: LucideIcon; keywords?: string[]; group?: string };

interface CommandMenuProps {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
  placeholder?: string;
}

function score(query: string, item: CommandItem): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const hay = [item.label, ...(item.keywords ?? [])].join(' ').toLowerCase();
  if (hay.includes(q)) return 10 - (hay.indexOf(q) / 100);
  // loose character-sequence match as fallback
  let qi = 0;
  for (let i = 0; i < hay.length && qi < q.length; i++) {
    if (hay[i] === q[qi]) qi++;
  }
  return qi === q.length ? 1 : 0;
}

export function CommandMenu({ open, onClose, items, placeholder = 'Cerca o crea…' }: CommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const scored = items
      .map((item) => ({ item, s: score(query, item) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s);
    return scored.map((r) => r.item);
  }, [items, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      // focus after mount
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = filtered[activeIdx];
        if (item) {
          router.push(item.href);
          onClose();
        }
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, filtered, activeIdx, onClose, router]);

  if (!open) return null;

  // Group items for display by their `group` field, preserving filtered order
  const groups: { title?: string; items: CommandItem[] }[] = [];
  for (const item of filtered) {
    const title = item.group ?? (item.type === 'create' ? 'Crea nuovo' : 'Vai a');
    const existing = groups.find((g) => g.title === title);
    if (existing) existing.items.push(item);
    else groups.push({ title, items: [item] });
  }

  let flatIdx = 0;

  return (
    <>
      <button
        type="button"
        aria-label="Chiudi"
        className="fixed inset-0 z-[80] bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Comandi"
        style={{ left: 'calc(50% + var(--shell-sidebar-w, 0px) / 2)' }}
        className="fixed top-[15vh] -translate-x-1/2 z-[90] w-[min(640px,calc(100vw-32px))] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={1.5} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent py-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none! ring-0! border-0 shadow-none!"
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-zinc-500">Nessun risultato</div>
          ) : (
            groups.map((group) => (
              <div key={group.title ?? 'ungrouped'} className="mb-2 last:mb-0">
                {group.title && (
                  <p className="px-3 pt-2 pb-1 text-xs uppercase tracking-wide text-zinc-500">
                    {group.title}
                  </p>
                )}
                <div className="flex flex-col">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const myIdx = flatIdx++;
                    const isActive = myIdx === activeIdx;
                    return (
                      <button
                        key={`${item.type}-${item.href}`}
                        type="button"
                        onMouseEnter={() => setActiveIdx(myIdx)}
                        onClick={() => {
                          router.push(item.href);
                          onClose();
                        }}
                        className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md text-left transition-colors ${
                          isActive
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={1.5} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {isActive && <CornerDownLeft className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-5 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">↑↓</kbd>
            Naviga
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">↵</kbd>
            Apri
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">Esc</kbd>
            Chiudi
          </span>
        </div>
      </div>
    </>
  );
}
