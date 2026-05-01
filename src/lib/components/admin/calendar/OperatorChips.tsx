'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { Users, Ban, Crosshair } from 'lucide-react';
import { useCalendarStore } from '@/lib/stores/calendar';
import { useOperatorsStore } from '@/lib/stores/operators';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import type { Operator } from '@/lib/types/Operator';

function operatorInitial(op: Operator): string {
  return (op.firstName?.[0] ?? '·').toUpperCase();
}

function OperatorAvatar({ operator }: { operator: Operator }) {
  if (operator.avatar_url) {
    return (
      <span className="block size-8 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={operator.avatar_url}
          alt=""
          width={32}
          height={32}
          className="size-full object-cover"
          draggable={false}
        />
      </span>
    );
  }
  return (
    <span className="size-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-700 dark:text-zinc-200 select-none">
      {operatorInitial(operator)}
    </span>
  );
}

interface OperatorChipsProps {
  /** Open the "Aggiungi ferie" modal for this operator. */
  onAddFerie?: (operator: Operator) => void;
}

export function OperatorChips({ onAddFerie }: OperatorChipsProps = {}) {
  const operators = useOperatorsStore((s) => s.operators);
  const currentView = useCalendarStore((s) => s.currentView);
  const selectedOperatorIds = useCalendarStore((s) => s.selectedOperatorIds);
  const focusedOperatorId = useCalendarStore((s) => s.focusedOperatorId);
  const setSelectedOperatorIds = useCalendarStore((s) => s.setSelectedOperatorIds);
  const setFocusedOperatorId = useCalendarStore((s) => s.setFocusedOperatorId);

  const [contextMenu, setContextMenu] = useState<{ operator: Operator; x: number; y: number } | null>(null);

  // Close the context menu on any outside click / escape.
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', esc);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', close, true);
    };
  }, [contextMenu]);

  const activeOperators = useMemo(
    () => operators.filter((op) => !op.isArchived),
    [operators],
  );

  // Resolve effective day-view membership: null sentinel == every active operator.
  const effectiveDayIds = useMemo(() => {
    if (selectedOperatorIds === null) return new Set(activeOperators.map((o) => o.id));
    return new Set(selectedOperatorIds);
  }, [selectedOperatorIds, activeOperators]);

  const allSelected = selectedOperatorIds === null;

  // Keep focusedOperatorId valid: must be an active operator that's currently selected
  // in day-view membership. Falls back to the first eligible operator.
  useEffect(() => {
    if (activeOperators.length === 0) {
      if (focusedOperatorId !== null) setFocusedOperatorId(null);
      return;
    }
    const eligible = activeOperators.filter((op) => effectiveDayIds.has(op.id));
    const focusValid = focusedOperatorId && eligible.some((op) => op.id === focusedOperatorId);
    if (!focusValid) {
      const next = eligible[0]?.id ?? activeOperators[0].id;
      setFocusedOperatorId(next);
    }
  }, [activeOperators, effectiveDayIds, focusedOperatorId, setFocusedOperatorId]);

  function chipIsSelected(operatorId: string): boolean {
    if (currentView === 'week') return operatorId === focusedOperatorId;
    return effectiveDayIds.has(operatorId);
  }

  function selectAll() {
    setSelectedOperatorIds(null);
    if (currentView === 'week' && activeOperators.length > 0) {
      // Keep the current focus if still active; otherwise pick first.
      const stillActive = focusedOperatorId && activeOperators.some((op) => op.id === focusedOperatorId);
      if (!stillActive) setFocusedOperatorId(activeOperators[0].id);
    }
  }

  function isolate(operatorId: string) {
    setSelectedOperatorIds([operatorId]);
    setFocusedOperatorId(operatorId);
  }

  function toggleMembership(operatorId: string) {
    if (currentView === 'week') {
      // Week view: clicking a chip swaps the focused operator without changing
      // the persisted multi-selection. Add it back to the selection if missing.
      setFocusedOperatorId(operatorId);
      if (!effectiveDayIds.has(operatorId)) {
        const next = selectedOperatorIds === null
          ? activeOperators.map((o) => o.id)
          : [...selectedOperatorIds, operatorId];
        setSelectedOperatorIds(next);
      }
      return;
    }

    // Day view: toggle membership.
    const allActiveIds = activeOperators.map((o) => o.id);
    let nextIds: string[];
    if (selectedOperatorIds === null) {
      // All currently selected — clicking removes this one.
      nextIds = allActiveIds.filter((id) => id !== operatorId);
    } else if (selectedOperatorIds.includes(operatorId)) {
      nextIds = selectedOperatorIds.filter((id) => id !== operatorId);
    } else {
      nextIds = [...selectedOperatorIds, operatorId];
    }

    // Collapse "every active operator" back to the null sentinel.
    if (nextIds.length === allActiveIds.length && allActiveIds.every((id) => nextIds.includes(id))) {
      setSelectedOperatorIds(null);
    } else {
      setSelectedOperatorIds(nextIds);
    }
  }

  function handleChipClick(e: React.MouseEvent, operatorId: string) {
    if (e.metaKey || e.ctrlKey) {
      isolate(operatorId);
    } else {
      toggleMembership(operatorId);
    }
  }

  if (activeOperators.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto px-1 py-1 -mx-1 -my-1 min-w-0">
      <button
        type="button"
        onClick={selectAll}
        aria-pressed={allSelected}
        className={[
          'flex items-center gap-1.5 h-8 px-2.5 rounded-full text-xs font-medium transition-colors shrink-0',
          allSelected
            ? 'bg-primary/10 text-primary-hover dark:text-primary/80 ring-1 ring-primary/30'
            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
        ].join(' ')}
      >
        <Users className="size-3.5" />
        <span>Tutti</span>
      </button>

      {activeOperators.map((op) => {
        const selected = chipIsSelected(op.id);
        return (
          <Tooltip key={op.id} label={op.getFullName()}>
            <button
              type="button"
              onClick={(e) => handleChipClick(e, op.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ operator: op, x: e.clientX, y: e.clientY });
              }}
              aria-pressed={selected}
              className={[
                'relative shrink-0 rounded-full transition-all',
                selected
                  ? 'opacity-100 ring-2 ring-primary'
                  : 'opacity-40 hover:opacity-80 ring-1 ring-zinc-300 dark:ring-zinc-700',
              ].join(' ')}
            >
              <OperatorAvatar operator={op} />
            </button>
          </Tooltip>
        );
      })}

      {contextMenu &&
        createPortal(
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed z-popover min-w-44 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden text-sm"
            style={{ left: Math.min(contextMenu.x, window.innerWidth - 200), top: contextMenu.y }}
          >
            <button
              type="button"
              onClick={() => {
                isolate(contextMenu.operator.id);
                setContextMenu(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
            >
              <Crosshair className="size-4" />
              Isola
            </button>
            {onAddFerie && (
              <button
                type="button"
                onClick={() => {
                  onAddFerie(contextMenu.operator);
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
              >
                <Ban className="size-4" />
                Aggiungi ferie
              </button>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
