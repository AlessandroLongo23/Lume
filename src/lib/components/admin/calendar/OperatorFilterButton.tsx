'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Ban, Check, Crosshair, GripVertical, Users } from 'lucide-react';
import { AnimatePresence, motion, Reorder, useDragControls, useReducedMotion } from 'motion/react';
import { useCalendarStore } from '@/lib/stores/calendar';
import { Button } from '@/lib/components/shared/ui/Button';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { useOperatorOrder } from '@/lib/hooks/useOperatorOrder';
import type { Operator } from '@/lib/types/Operator';

function OperatorAvatar({ operator }: { operator: Operator }) {
  if (operator.avatar_url) {
    return (
      <span className="block size-7 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
        <Image
          src={operator.avatar_url}
          alt=""
          width={28}
          height={28}
          className="size-full object-cover"
          draggable={false}
        />
      </span>
    );
  }
  return (
    <span className="size-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-700 dark:text-zinc-200 select-none shrink-0">
      {(operator.firstName?.[0] ?? '·').toUpperCase()}
    </span>
  );
}

function RowCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={[
        'size-4 rounded border flex items-center justify-center shrink-0 transition-colors',
        checked ? 'bg-primary border-primary' : 'border-zinc-300 dark:border-zinc-600',
      ].join(' ')}
    >
      {checked && <Check className="size-3 text-white" strokeWidth={3} />}
    </span>
  );
}

function RowRadio({ checked }: { checked: boolean }) {
  return (
    <span
      className={[
        'size-4 rounded-full border flex items-center justify-center shrink-0 transition-colors',
        checked ? 'border-primary' : 'border-zinc-300 dark:border-zinc-600',
      ].join(' ')}
    >
      {checked && <span className="size-2 rounded-full bg-primary" />}
    </span>
  );
}

interface OperatorRowProps {
  operator: Operator;
  isWeek: boolean;
  checked: boolean;
  onActivate: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

function OperatorRow({ operator, isWeek, checked, onActivate, onContextMenu }: OperatorRowProps) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      as="div"
      value={operator.id}
      dragListener={false}
      dragControls={controls}
      role={isWeek ? 'radio' : 'button'}
      aria-checked={isWeek ? checked : undefined}
      aria-pressed={!isWeek ? checked : undefined}
      tabIndex={0}
      onClick={onActivate}
      onContextMenu={onContextMenu}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActivate();
        }
      }}
      whileDrag={{ scale: 1.01, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
      className="flex w-full items-center gap-2 pl-2 pr-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer bg-white dark:bg-zinc-800 select-none focus:outline-none focus-visible:bg-zinc-50 dark:focus-visible:bg-zinc-700/50"
    >
      <span
        aria-hidden
        className="text-zinc-300 dark:text-zinc-500 cursor-grab active:cursor-grabbing shrink-0 touch-none"
        onPointerDown={(e) => {
          e.preventDefault();
          controls.start(e);
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="size-4" />
      </span>
      <OperatorAvatar operator={operator} />
      <span className="grow text-left truncate">{operator.getFullName()}</span>
      {isWeek ? <RowRadio checked={checked} /> : <RowCheckbox checked={checked} />}
    </Reorder.Item>
  );
}

interface OperatorFilterButtonProps {
  onAddFerie?: (operator: Operator) => void;
}

export function OperatorFilterButton({ onAddFerie }: OperatorFilterButtonProps = {}) {
  const { orderedOperators, orderedIds, setOrder } = useOperatorOrder();
  const selectedOperatorIds = useCalendarStore((s) => s.selectedOperatorIds);
  const focusedOperatorId = useCalendarStore((s) => s.focusedOperatorId);
  const currentView = useCalendarStore((s) => s.currentView);
  const setSelectedOperatorIds = useCalendarStore((s) => s.setSelectedOperatorIds);
  const setFocusedOperatorId = useCalendarStore((s) => s.setFocusedOperatorId);
  const isWeek = currentView === 'week';

  const [open, setOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ operator: Operator; x: number; y: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const reduceMotion = useReducedMotion();

  const effectiveDayIds = useMemo(() => {
    if (selectedOperatorIds === null) return new Set(orderedOperators.map((o) => o.id));
    return new Set(selectedOperatorIds);
  }, [selectedOperatorIds, orderedOperators]);

  const allSelected = selectedOperatorIds === null;

  // Position the panel below-right of the trigger button.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const r = triggerRef.current!.getBoundingClientRect();
      setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  // Close panel on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close panel on Escape.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Close context menu on outside click / scroll / Escape.
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', esc);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', close, true);
    };
  }, [contextMenu]);

  function selectAll() {
    setSelectedOperatorIds(null);
    if (orderedOperators.length > 0) {
      const stillActive = focusedOperatorId && orderedOperators.some((op) => op.id === focusedOperatorId);
      if (!stillActive) setFocusedOperatorId(orderedOperators[0].id);
    }
  }

  function isolate(operatorId: string) {
    setSelectedOperatorIds([operatorId]);
    setFocusedOperatorId(operatorId);
  }

  function toggleMembership(operatorId: string) {
    const allActiveIds = orderedOperators.map((o) => o.id);
    let nextIds: string[];
    if (selectedOperatorIds === null) {
      nextIds = allActiveIds.filter((id) => id !== operatorId);
    } else if (selectedOperatorIds.includes(operatorId)) {
      nextIds = selectedOperatorIds.filter((id) => id !== operatorId);
    } else {
      nextIds = [...selectedOperatorIds, operatorId];
    }
    // Collapse back to null sentinel when every active operator is selected.
    if (nextIds.length === allActiveIds.length && allActiveIds.every((id) => nextIds.includes(id))) {
      setSelectedOperatorIds(null);
    } else {
      setSelectedOperatorIds(nextIds);
    }
  }

  if (orderedOperators.length === 0) return null;

  return (
    <>
      <div className="relative">
        <Button
          ref={triggerRef}
          variant="secondary"
          size="md"
          iconOnly
          aria-label="Filtra operatori"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <Users />
        </Button>
        {!isWeek && !allSelected && (
          <span
            aria-hidden
            className="absolute top-0.5 right-0.5 size-2 rounded-full bg-primary pointer-events-none"
          />
        )}
      </div>

      <AnimatePresence>
        {open && pos && (
          <Portal>
            <motion.div
              ref={panelRef}
              className="fixed w-60 bg-white dark:bg-zinc-800 border border-zinc-500/25 rounded-lg shadow-lg z-dropdown overflow-hidden"
              style={{ top: pos.top, right: pos.right, transformOrigin: '100% 0%' }}
              role={isWeek ? 'radiogroup' : undefined}
              aria-label={isWeek ? 'Operatore visibile' : undefined}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6 }}
              transition={{
                duration: reduceMotion ? 0.12 : 0.18,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
            {/* Select-all row — only in multi-select (day/month) view */}
            {!isWeek && (
              <>
                <button
                  type="button"
                  onClick={selectAll}
                  className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-sm text-zinc-700 dark:text-zinc-300"
                >
                  <RowCheckbox checked={allSelected} />
                  <span className="grow text-left font-medium">Tutti gli operatori</span>
                </button>

                <div className="border-t border-zinc-500/15 mx-3 my-0.5" />
              </>
            )}

            {/* Per-operator rows — drag to reorder via grip handle */}
            <Reorder.Group
              as="div"
              axis="y"
              values={orderedIds}
              onReorder={setOrder}
              className="max-h-80 overflow-y-auto overflow-x-hidden"
            >
              {orderedOperators.map((op) => {
                const checked = isWeek ? focusedOperatorId === op.id : effectiveDayIds.has(op.id);
                return (
                  <OperatorRow
                    key={op.id}
                    operator={op}
                    isWeek={isWeek}
                    checked={checked}
                    onActivate={() => {
                      if (isWeek) {
                        setFocusedOperatorId(op.id);
                        setOpen(false);
                      } else {
                        toggleMembership(op.id);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ operator: op, x: e.clientX, y: e.clientY });
                    }}
                  />
                );
              })}
            </Reorder.Group>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>

      {/* Right-click context menu */}
      {contextMenu && (
        <Portal>
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed z-popover min-w-44 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden text-sm"
            style={{ left: Math.min(contextMenu.x, window.innerWidth - 200), top: Math.min(contextMenu.y, window.innerHeight - 100) }}
          >
            {!isWeek && (
              <button
                type="button"
                onClick={() => { isolate(contextMenu.operator.id); setContextMenu(null); }}
                className="flex w-full items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
              >
                <Crosshair className="size-4" />
                Isola
              </button>
            )}
            {onAddFerie && (
              <button
                type="button"
                onClick={() => { onAddFerie(contextMenu.operator); setContextMenu(null); }}
                className="flex w-full items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
              >
                <Ban className="size-4" />
                Aggiungi ferie
              </button>
            )}
          </div>
        </Portal>
      )}
    </>
  );
}
