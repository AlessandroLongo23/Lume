'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CornerDownLeft, Loader2, Search } from 'lucide-react';

import type { ProfileRole } from '@/lib/auth/roles';

import { useCommandSearch } from './commandMenu/useCommandSearch';
import type { CommandAction, CommandResult } from './commandMenu/types';

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

interface CommandMenuProps {
  open: boolean;
  onClose: () => void;
  role: ProfileRole | null;
  extraActions?: CommandAction[];
  placeholder?: string;
}

const SPINNER_DELAY_MS = 250;
const CONFIRM_TIMEOUT_MS = 4000;

type Section = { title: string; items: CommandResult[] };

function sectionTitleFor(result: CommandResult): string {
  if (result.kind === 'nav') return result.group ?? 'Navigazione';
  if (result.kind === 'action') return result.group ?? 'Azioni';
  switch (result.entity.type) {
    case 'client':           return 'Clienti';
    case 'service':          return 'Servizi';
    case 'product':          return 'Prodotti';
    case 'fiche':            return 'Fiches';
    case 'operator':         return 'Operatori';
    case 'order':            return 'Ordini';
    case 'coupon':           return 'Coupons';
    case 'abbonamento':      return 'Abbonamenti';
    case 'service-category': return 'Categorie servizi';
    case 'product-category': return 'Categorie prodotti';
  }
}

function groupResults(results: CommandResult[]): Section[] {
  const out: Section[] = [];
  for (const r of results) {
    const title = sectionTitleFor(r);
    const existing = out.find((s) => s.title === title);
    if (existing) existing.items.push(r);
    else out.push({ title, items: [r] });
  }
  return out;
}

function resultId(r: CommandResult): string {
  if (r.kind === 'nav') return r.id;
  if (r.kind === 'action') return r.action.id;
  return `entity-${r.entity.type}-${r.entity.id}`;
}

function resultLabel(r: CommandResult): string {
  if (r.kind === 'nav') return r.label;
  if (r.kind === 'action') return r.action.label;
  return r.entity.label;
}

function resultSubtitle(r: CommandResult): string | undefined {
  if (r.kind === 'entity') return r.entity.subtitle;
  return undefined;
}

export function CommandMenu({
  open,
  onClose,
  role,
  extraActions,
  placeholder = 'Cerca o digita un comando…',
}: CommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [pendingConfirmId, setPendingConfirmId] = useState<string | null>(null);
  const [showSpinner, setShowSpinner] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const stableExtras = useMemo(() => extraActions ?? [], [extraActions]);
  const { results, loading, isEmptyQuery } = useCommandSearch(query, role, stableExtras);

  // Skeleton rows are rendered when we're in flight and don't yet have results.
  const showSkeletons = loading && !isEmptyQuery && results.every((r) => r.kind !== 'entity');

  // Focus + reset on open.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIdx(0);
    setPendingConfirmId(null);
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  // Reset active index + pending confirm when the visible result list changes.
  useEffect(() => {
    setActiveIdx((i) => (i >= results.length ? 0 : i));
    setPendingConfirmId(null);
  }, [results]);

  // Delayed spinner so fast queries don't flicker.
  useEffect(() => {
    if (!loading) {
      setShowSpinner(false);
      return;
    }
    const t = window.setTimeout(() => setShowSpinner(true), SPINNER_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [loading]);

  // Auto-cancel pending inline confirm after inactivity.
  useEffect(() => {
    if (!pendingConfirmId) return;
    const t = window.setTimeout(() => setPendingConfirmId(null), CONFIRM_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [pendingConfirmId]);

  const activate = useCallback(
    (result: CommandResult) => {
      if (result.kind === 'nav') {
        router.push(result.href);
        onClose();
        return;
      }
      if (result.kind === 'entity') {
        router.push(result.entity.href);
        onClose();
        return;
      }
      const action = result.action;
      if (action.danger === 'confirm-inline') {
        if (pendingConfirmId === action.id) {
          setPendingConfirmId(null);
          void action.perform(router);
          onClose();
        } else {
          setPendingConfirmId(action.id);
        }
        return;
      }
      void action.perform(router);
      onClose();
    },
    [pendingConfirmId, router, onClose],
  );

  // Keyboard navigation.
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (pendingConfirmId) {
          setPendingConfirmId(null);
        } else {
          onClose();
        }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setPendingConfirmId(null);
        setActiveIdx((i) => Math.min(results.length - 1, i + 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setPendingConfirmId(null);
        setActiveIdx((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const item = results[activeIdx];
        if (item) activate(item);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, results, activeIdx, activate, onClose, pendingConfirmId]);

  if (!open) return null;

  const sections = groupResults(results);
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
          {showSpinner && (
            <Loader2 className="w-4 h-4 text-zinc-400 shrink-0 animate-spin" strokeWidth={1.5} />
          )}
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && !showSkeletons ? (
            <div className="px-3 py-6 text-center text-sm text-zinc-500">
              {isEmptyQuery ? 'Inizia a digitare per cercare' : 'Nessun risultato'}
            </div>
          ) : (
            <>
              {sections.map((section) => (
                <div key={section.title} className="mb-2 last:mb-0">
                  <p className="px-3 pt-2 pb-1 text-xs uppercase tracking-wide text-zinc-500">
                    {section.title}
                  </p>
                  <div className="flex flex-col">
                    {section.items.map((item) => {
                      const myIdx = flatIdx++;
                      return (
                        <ResultRow
                          key={resultId(item)}
                          result={item}
                          active={myIdx === activeIdx}
                          pendingConfirm={
                            item.kind === 'action' && pendingConfirmId === item.action.id
                          }
                          onMouseEnter={() => setActiveIdx(myIdx)}
                          onClick={() => activate(item)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              {showSkeletons && <SkeletonSection />}
            </>
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

interface ResultRowProps {
  result: CommandResult;
  active: boolean;
  pendingConfirm: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}

function ResultRow({ result, active, pendingConfirm, onMouseEnter, onClick }: ResultRowProps) {
  const Icon =
    result.kind === 'nav' ? result.icon
    : result.kind === 'action' ? result.action.icon
    : result.icon;
  const label = pendingConfirm ? `Conferma: ${resultLabel(result)}` : resultLabel(result);
  const subtitle = resultSubtitle(result);
  const danger =
    result.kind === 'action' && result.action.danger === 'confirm-inline' && pendingConfirm;
  const isAction = result.kind === 'action';
  const kbd = isAction ? result.action.kbd : undefined;

  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={[
        'flex items-center gap-3 px-3 py-2 text-sm rounded-md text-left transition-colors',
        danger
          ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
          : active
          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60',
      ].join(' ')}
    >
      {danger ? (
        <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
      ) : (
        <Icon
          className={`w-4 h-4 shrink-0 ${active ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400'}`}
          strokeWidth={1.5}
        />
      )}
      <span className="flex-1 truncate">{label}</span>
      {subtitle && (
        <span className="text-xs text-zinc-400 shrink-0 truncate max-w-[40%]">{subtitle}</span>
      )}
      {kbd && (
        <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-500">
          {kbd}
        </kbd>
      )}
      {(active || pendingConfirm) && (
        <CornerDownLeft className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
      )}
    </button>
  );
}

function SkeletonSection() {
  return (
    <div className="mb-2">
      <p className="px-3 pt-2 pb-1 text-xs uppercase tracking-wide text-zinc-500">Risultati</p>
      <div className="flex flex-col">
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-800 shrink-0 animate-pulse" />
      <div className="flex-1 h-3 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      <div className="w-16 h-3 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
    </div>
  );
}
