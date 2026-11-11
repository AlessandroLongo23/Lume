'use client';

/**
 * Flat list, entities + actions inline.
 *
 * One scrollable list. Each entity match shows as a row, immediately followed
 * by its bound actions (Modifica, Elimina, …) as smaller, indented sub-rows.
 * Runs of rows from the same source (Recenti, Risultati, Vai a, Crea nuovo,
 * Visualizzazione) get a small secondary label. The list is a <ListBox>, so
 * its glide follows the pointer and the keyboard-active row.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CornerDownLeft } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import type { ProfileRole } from '@/lib/auth/roles';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { DURATION, EASE_OUT } from '@/lib/const/motion';
import { useListNavigation } from '@/lib/hooks/useListNavigation';
import { ListBox, ListEmpty, ListGroupLabel, ListRow } from '@/lib/components/shared/ui/list/ListBox';
import { CommandSearchField } from './CommandSearchField';
import { cn } from '@/lib/utils';

import { Kbd } from '@/lib/components/shared/ui/Kbd';
import { useCommandSearch } from './commandMenu/useCommandSearch';
import type {
  CommandAction,
  CommandResult,
  EntityType,
} from './commandMenu/types';

// Entity icons keep an identity colour so a client, a service or a receipt is
// recognisable before its label is read. Nav and action icons stay neutral.
const ENTITY_ICON_TONE: Record<EntityType, string> = {
  client: 'text-info-strong',
  operator: 'text-info-strong',
  service: 'text-[var(--lume-brass-fg)]',
  abbonamento: 'text-[var(--lume-brass-fg)]',
  coupon: 'text-[var(--lume-brass-fg)]',
  product: 'text-success-strong',
  order: 'text-success-strong',
  fiche: 'text-warning-strong',
  'service-category': 'text-[var(--lume-text-muted)]',
  'product-category': 'text-[var(--lume-text-muted)]',
};

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
}

const SPINNER_DELAY_MS = 250;
const CONFIRM_TIMEOUT_MS = 4000;

type FlatItem =
  | { kind: 'item'; result: CommandResult; nested: boolean; groupLabel?: string };

function groupOf(r: CommandResult, isEmptyQuery: boolean): string {
  if (r.kind === 'entity') return isEmptyQuery ? 'Recenti' : 'Risultati';
  return r.group ?? 'Azioni';
}

function flattenResults(results: CommandResult[], isEmptyQuery: boolean): FlatItem[] {
  const out: FlatItem[] = [];
  let lastGroup: string | null = null;
  for (const r of results) {
    const group = groupOf(r, isEmptyQuery);
    const groupLabel = group !== lastGroup ? group : undefined;
    lastGroup = group;

    if (r.kind === 'entity') {
      out.push({ kind: 'item', result: r, nested: false, groupLabel });
      // Skip the first action: it's "Apri" which Enter on the entity row already runs.
      for (let i = 1; i < r.actions.length; i++) {
        const action = r.actions[i];
        out.push({
          kind: 'item',
          result: { kind: 'action', action },
          nested: true,
        });
      }
      continue;
    }
    out.push({ kind: 'item', result: r, nested: false, groupLabel });
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
}: CommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [pendingConfirmId, setPendingConfirmId] = useState<string | null>(null);
  const [showSpinner, setShowSpinner] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  // The glide follows `data-highlighted`, but only reacts to attribute
  // changes: mark the active row one tick after the list mounts so the first
  // row lights up as soon as the palette opens.
  const [glideReady, setGlideReady] = useState(false);
  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the glide marker on close.
      setGlideReady(false);
      return;
    }
    const raf = window.requestAnimationFrame(() => setGlideReady(true));
    return () => window.cancelAnimationFrame(raf);
  }, [open]);

  const stableExtras = useMemo(() => extraActions ?? [], [extraActions]);
  const { results, loading, isEmptyQuery } = useCommandSearch(query, role, stableExtras);

  const flatItems = useMemo(() => flattenResults(results, isEmptyQuery), [results, isEmptyQuery]);
  const showSkeletons =
    loading && !isEmptyQuery && results.every((r) => r.kind !== 'entity');

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

  const nav = useListNavigation({
    count: flatItems.length,
    onPick: (i) => activate(flatItems[i].result),
    onEscape: () => (pendingConfirmId ? setPendingConfirmId(null) : onClose()),
    listRef,
  });
  const { active: activeIdx, setActive: setActiveIdx } = nav;

  // Focus + reset on open.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset palette state on every open.
    setQuery('');
    setActiveIdx(0);
    setPendingConfirmId(null);
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open, setActiveIdx]);

  useEffect(() => {
    setActiveIdx((i) => (i >= flatItems.length ? 0 : i));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a new result list drops a pending confirm.
    setPendingConfirmId(null);
  }, [flatItems, setActiveIdx]);

  // Keys reach the palette from the search input and from a clicked row.
  // Home/End stay with the input's caret; Tab stays inside the dialog.
  const onPaletteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' || e.key === 'Home' || e.key === 'End') return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') setPendingConfirmId(null);
    nav.onKeyDown(e);
  };

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
              placeholder="Cerca o digita un comando…"
              loading={showSpinner}
            />

            <ListBox
              ref={listRef}
              role="listbox"
              aria-label="Risultati"
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5"
            >
              {flatItems.length === 0 && !showSkeletons ? (
                <ListEmpty>{isEmptyQuery ? 'Inizia a digitare per cercare' : 'Nessun risultato'}</ListEmpty>
              ) : (
                <>
                  {flatItems.map((item, idx) => (
                    <FlatRowWrapper
                      key={flatItemId(item)}
                      item={item}
                      active={idx === activeIdx}
                      highlighted={glideReady && idx === activeIdx}
                      pendingConfirm={
                        item.result.kind === 'action' &&
                        pendingConfirmId === item.result.action.id
                      }
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => activate(item.result)}
                    />
                  ))}
                  {showSkeletons && <SkeletonRows />}
                </>
              )}
            </ListBox>

            <div className="flex items-center gap-4 px-4 py-2.5 shrink-0 border-t border-line text-xs text-[var(--lume-text-secondary)] pointer-coarse:hidden">
              <span className="flex items-center gap-1.5">
                <span className="flex gap-0.5"><Kbd>↑</Kbd><Kbd>↓</Kbd></span>
                Naviga
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>↵</Kbd>
                Esegui
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

interface FlatRowWrapperProps {
  item: FlatItem;
  active: boolean;
  highlighted: boolean;
  pendingConfirm: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}

function FlatRowWrapper({ item, active, highlighted, pendingConfirm, onMouseEnter, onClick }: FlatRowWrapperProps) {
  return (
    <>
      {item.groupLabel && (
        <ListGroupLabel className="px-2.5 select-none">{item.groupLabel}</ListGroupLabel>
      )}
      <FlatRow
        result={item.result}
        nested={item.nested}
        active={active}
        highlighted={highlighted}
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
  highlighted: boolean;
  pendingConfirm: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}

function FlatRow({ result, nested, active, highlighted, pendingConfirm, onMouseEnter, onClick }: FlatRowProps) {
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

  // asChild: the row keeps its own layout (identity-tinted icon, subtitle,
  // shortcut, Enter hint) and takes the list-row look and glide wiring.
  return (
    <ListRow asChild highlighted={highlighted} destructive={danger}>
      <button
        // ds-ignore: palette row under ListRow asChild, which gives the list-row look and glide; the button keeps its own layout (identity-tinted icon, subtitle, Enter hint)
        type="button"
        onMouseEnter={onMouseEnter}
        onClick={onClick}
        className={cn(
          'shrink-0',
          nested ? 'min-h-8 pointer-coarse:min-h-10 pl-9 text-compact' : 'text-[var(--lume-text)]',
          danger && 'bg-danger-soft',
        )}
      >
        {danger ? (
          <AlertTriangle className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
        ) : (
          <Icon
            className={cn(
              'shrink-0',
              nested ? 'size-3.5' : 'size-4',
              result.kind === 'entity'
                ? ENTITY_ICON_TONE[result.entity.type]
                : active ? 'text-[var(--lume-text)]' : 'text-[var(--lume-text-muted)]',
            )}
            strokeWidth={1.75}
            aria-hidden
          />
        )}
        <span className="flex-1 min-w-0 truncate">{label}</span>
        {subtitle && (
          <span className="text-xs text-[var(--lume-text-muted)] shrink-0 truncate max-w-[40%]">{subtitle}</span>
        )}
        {kbd && <Kbd>{kbd}</Kbd>}
        {(active || pendingConfirm) && (
          <CornerDownLeft className="size-3.5 text-[var(--lume-text-muted)] shrink-0" strokeWidth={1.75} aria-hidden />
        )}
      </button>
    </ListRow>
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
    <div className="flex items-center gap-2.5 h-9 px-3" aria-hidden>
      <div className="size-4 rounded-sm bg-active shrink-0 motion-safe:animate-pulse" />
      <div className="flex-1 h-3 rounded-sm bg-active motion-safe:animate-pulse" />
      <div className="w-16 h-3 rounded-sm bg-active motion-safe:animate-pulse" />
    </div>
  );
}
