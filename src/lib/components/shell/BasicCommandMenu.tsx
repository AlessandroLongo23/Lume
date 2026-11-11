'use client';

/**
 * BasicCommandMenu — the legacy item-list command palette used by surfaces
 * outside the salon admin (e.g. /platform), where there's no entity search
 * and the input is a fixed list of nav links + actions.
 *
 * The salon admin uses CommandMenu.tsx instead, which wires in
 * useCommandSearch + the Supabase RPC.
 */

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CornerDownLeft, type LucideIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { DURATION, EASE_OUT } from '@/lib/const/motion';
import { useListNavigation } from '@/lib/hooks/useListNavigation';
import { ListBox, ListEmpty, ListGroupLabel, ListRow } from '@/lib/components/shared/ui/list/ListBox';
import { CommandSearchField } from './CommandSearchField';
import { Kbd } from '@/lib/components/shared/ui/Kbd';

export type BasicCommandItem =
  | { type: 'nav';    label: string; href: string;          icon: LucideIcon; keywords?: string[]; group?: string }
  | { type: 'action'; label: string; onSelect: () => void;  icon: LucideIcon; kbd?: string; keywords?: string[]; group?: string };

interface BasicCommandMenuProps {
  open: boolean;
  onClose: () => void;
  items: BasicCommandItem[];
}

function score(query: string, item: BasicCommandItem): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const hay = [item.label, ...(item.keywords ?? [])].join(' ').toLowerCase();
  if (hay.includes(q)) return 10 - hay.indexOf(q) / 100;
  let qi = 0;
  for (let i = 0; i < hay.length && qi < q.length; i++) {
    if (hay[i] === q[qi]) qi++;
  }
  return qi === q.length ? 1 : 0;
}

export function BasicCommandMenu({
  open,
  onClose,
  items,
}: BasicCommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  // See CommandMenu: mark the active row a tick after mount so the glide
  // (which reacts to attribute changes) starts on it.
  const [glideReady, setGlideReady] = useState(false);
  useEffect(() => {
    if (!open) {
      setGlideReady(false);
      return;
    }
    const raf = window.requestAnimationFrame(() => setGlideReady(true));
    return () => window.cancelAnimationFrame(raf);
  }, [open]);

  // Grouped in display order, so the keyboard index and the row on screen
  // are always the same item.
  const groups = useMemo(() => {
    const out: { title: string; items: BasicCommandItem[] }[] = [];
    for (const r of items
      .map((item) => ({ item, s: score(query, item) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)) {
      const title = r.item.group ?? 'Vai a';
      const existing = out.find((g) => g.title === title);
      if (existing) existing.items.push(r.item);
      else out.push({ title, items: [r.item] });
    }
    return out;
  }, [items, query]);
  const ordered = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const run = (item: BasicCommandItem) => {
    if (item.type === 'action') item.onSelect();
    else router.push(item.href);
    onClose();
  };

  const nav = useListNavigation({
    count: ordered.length,
    onPick: (i) => run(ordered[i]),
    onEscape: onClose,
    listRef,
  });
  const { active: activeIdx, setActive: setActiveIdx } = nav;

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIdx(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open, setActiveIdx]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query, setActiveIdx]);

  // Home/End stay with the input's caret; Tab stays inside the dialog.
  const onPaletteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' || e.key === 'Home' || e.key === 'End') return;
    nav.onKeyDown(e);
  };

  let flatIdx = 0;

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.button
            key="command-backdrop"
            type="button"
            aria-label="Chiudi"
            tabIndex={-1}
            className="fixed inset-0 z-command bg-[color-mix(in_oklab,var(--lume-overlay)_55%,transparent)] cursor-default"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: DURATION.fast } }}
            transition={{ duration: DURATION.fast }}
          />
        )}
        {open && (
          <motion.div
            key="command-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Comandi"
            onKeyDown={onPaletteKeyDown}
            className="surface-float fixed top-[12vh] left-1/2 -translate-x-1/2 z-command w-[min(640px,calc(100vw-32px))] flex flex-col max-h-[min(520px,76vh)] overflow-hidden"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={{
              ...(reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }),
              transition: { duration: DURATION.fast, ease: EASE_OUT },
            }}
            transition={{ duration: DURATION.fast, ease: EASE_OUT }}
          >
            <CommandSearchField
              ref={inputRef}
              value={query}
              onChange={setQuery}
              placeholder="Cerca o crea…"
            />

            <ListBox
              ref={listRef}
              role="listbox"
              aria-label="Risultati"
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5"
            >
              {ordered.length === 0 ? (
                <ListEmpty>Nessun risultato</ListEmpty>
              ) : (
                groups.map((group) => (
                  <Fragment key={group.title}>
                    <ListGroupLabel className="px-2.5 select-none">{group.title}</ListGroupLabel>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const myIdx = flatIdx++;
                      const isActive = myIdx === activeIdx;
                      const itemKey = item.type === 'action' ? `action-${item.label}` : `${item.type}-${item.href}`;
                      return (
                        <ListRow key={itemKey} asChild highlighted={glideReady && isActive}>
                          <button
                            // ds-ignore: palette row under ListRow asChild, which gives the list-row look and glide; the button keeps its own layout (icon lit on the keyboard-active row, Enter hint)
                            type="button"
                            onMouseEnter={() => setActiveIdx(myIdx)}
                            onClick={() => run(item)}
                            className="shrink-0 text-[var(--lume-text)]"
                          >
                            <Icon
                              className={`size-4 shrink-0 ${isActive ? 'text-[var(--lume-text)]' : 'text-[var(--lume-text-muted)]'}`}
                              strokeWidth={1.75}
                              aria-hidden
                            />
                            <span className="flex-1 min-w-0 truncate">{item.label}</span>
                            {item.type === 'action' && item.kbd && <Kbd>{item.kbd}</Kbd>}
                            {isActive && (
                              <CornerDownLeft className="size-3.5 text-[var(--lume-text-muted)] shrink-0" strokeWidth={1.75} aria-hidden />
                            )}
                          </button>
                        </ListRow>
                      );
                    })}
                  </Fragment>
                ))
              )}
            </ListBox>

            <div className="flex items-center gap-4 px-4 py-2.5 shrink-0 border-t border-line text-xs text-[var(--lume-text-secondary)] pointer-coarse:hidden">
              <span className="flex items-center gap-1.5">
                <span className="flex gap-0.5"><Kbd>↑</Kbd><Kbd>↓</Kbd></span>
                Naviga
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>↵</Kbd>
                Apri
              </span>
              <span className="flex items-center gap-1.5 ml-auto">
                <Kbd>Esc</Kbd>
                Chiudi
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
