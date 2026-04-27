'use client';

/**
 * VARIANT B — Flat list, entities + actions inline.
 *
 * One single scrollable list. Each entity match shows as a row, immediately
 * followed by its bound actions (Modifica, Elimina, …) rendered as smaller,
 * indented sub-rows. Standalone "Crea nuovo X" actions appear at the bottom
 * separated by a thin divider. No drill-in, no section headers — closer to
 * Raycast: discoverable but the lists get long.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CornerDownLeft, Loader2, Search } from 'lucide-react';

import type { ProfileRole } from '@/lib/auth/roles';

import { useCommandSearch } from './commandMenu/useCommandSearch';
import type {
  CommandAction,
  CommandResult,
} from './commandMenu/types';

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

type FlatItem =
  | { kind: 'item'; result: CommandResult; nested: boolean; precededByDivider: boolean };

function flattenResults(results: CommandResult[]): FlatItem[] {
  const out: FlatItem[] = [];
  let standaloneStarted = false;
  for (const r of results) {
    const isStandalone =
      r.kind === 'action' &&
      (r.group === 'Crea nuovo' || r.group === 'Visualizzazione');
    const precededByDivider = isStandalone && !standaloneStarted;
    if (isStandalone) standaloneStarted = true;

    if (r.kind === 'entity') {
      out.push({ kind: 'item', result: r, nested: false, precededByDivider });
      // Skip the first action: it's "Apri" which Enter on the entity row already runs.
      for (let i = 1; i < r.actions.length; i++) {
        const action = r.actions[i];
        out.push({
          kind: 'item',
          result: { kind: 'action', action },
          nested: true,
          precededByDivider: false,
        });
      }
      continue;
    }
    out.push({ kind: 'item', result: r, nested: false, precededByDivider });
  }
  return out;
}

function flatItemId(item: FlatItem): string {
  const r = item.result;
  if (r.kind === 'nav') return r.id;
  if (r.kind === 'action') return `action-${item.nested ? 'n' : 's'}-${r.action.id}`;
  return `entity-${r.entity.type}-${r.entity.id}`;
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

  const flatItems = useMemo(() => flattenResults(results), [results]);
  const showSkeletons =
    loading && !isEmptyQuery && results.every((r) => r.kind !== 'entity');

  // Focus + reset on open.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset palette state on every open.
    setQuery('');
    setActiveIdx(0);
    setPendingConfirmId(null);
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clamp active idx on result-list change.
    setActiveIdx((i) => (i >= flatItems.length ? 0 : i));
    setPendingConfirmId(null);
  }, [flatItems]);

  useEffect(() => {
    if (!loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear spinner when loading drops.
      setShowSpinner(false);
      return;
    }
    const t = window.setTimeout(() => setShowSpinner(true), SPINNER_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [loading]);

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

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (pendingConfirmId) setPendingConfirmId(null);
        else onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setPendingConfirmId(null);
        setActiveIdx((i) => Math.min(flatItems.length - 1, i + 1));
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
        const item = flatItems[activeIdx];
        if (item) activate(item.result);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, flatItems, activeIdx, activate, onClose, pendingConfirmId]);

  if (!open) return null;

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
        className="fixed top-[15vh] left-1/2 -translate-x-1/2 z-[90] w-[min(640px,calc(100vw-32px))] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden"
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
          {flatItems.length === 0 && !showSkeletons ? (
            <div className="px-3 py-6 text-center text-sm text-zinc-500">
              {isEmptyQuery ? 'Inizia a digitare per cercare' : 'Nessun risultato'}
            </div>
          ) : (
            <div className="flex flex-col">
              {flatItems.map((item, idx) => (
                <FlatRowWrapper
                  key={flatItemId(item)}
                  item={item}
                  active={idx === activeIdx}
                  pendingConfirm={
                    item.result.kind === 'action' &&
                    pendingConfirmId === item.result.action.id
                  }
                  onMouseEnter={() => setActiveIdx(idx)}
                  onClick={() => activate(item.result)}
                />
              ))}
              {showSkeletons && <SkeletonRows />}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-5 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">↑↓</kbd>
            Naviga
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">↵</kbd>
            Esegui
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

interface FlatRowWrapperProps {
  item: FlatItem;
  active: boolean;
  pendingConfirm: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}

function FlatRowWrapper({ item, active, pendingConfirm, onMouseEnter, onClick }: FlatRowWrapperProps) {
  return (
    <>
      {item.precededByDivider && (
        <div className="my-1 mx-2 h-px bg-zinc-200 dark:bg-zinc-800" />
      )}
      <FlatRow
        result={item.result}
        nested={item.nested}
        active={active}
        pendingConfirm={pendingConfirm}
        onMouseEnter={onMouseEnter}
        onClick={onClick}
      />
    </>
  );
}

interface FlatRowProps {
  result: CommandResult;
  nested: boolean;
  active: boolean;
  pendingConfirm: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}

function FlatRow({ result, nested, active, pendingConfirm, onMouseEnter, onClick }: FlatRowProps) {
  const Icon =
    result.kind === 'nav' ? result.icon
    : result.kind === 'action' ? result.action.icon
    : result.icon;
  const baseLabel =
    result.kind === 'nav'
      ? result.label
      : result.kind === 'action'
      ? result.action.label
      : result.entity.label;
  const label = pendingConfirm ? `Conferma: ${baseLabel}` : baseLabel;
  const subtitle = result.kind === 'entity' ? result.entity.subtitle : undefined;
  const danger =
    result.kind === 'action' && result.action.danger === 'confirm-inline' && pendingConfirm;
  const kbd = result.kind === 'action' ? result.action.kbd : undefined;

  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={[
        'flex items-center gap-3 rounded-md text-left transition-colors',
        nested ? 'pl-9 pr-3 py-1.5 text-[13px]' : 'px-3 py-2 text-sm',
        danger
          ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
          : active
          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
          : nested
          ? 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60',
      ].join(' ')}
    >
      {danger ? (
        <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
      ) : (
        <Icon
          className={[
            'shrink-0',
            nested ? 'w-3.5 h-3.5' : 'w-4 h-4',
            active ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400',
          ].join(' ')}
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

function SkeletonRows() {
  return (
    <>
      <SkeletonRow />
      <SkeletonRow />
    </>
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
