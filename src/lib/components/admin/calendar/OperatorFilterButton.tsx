'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Ban, Check, Crosshair, Users } from 'lucide-react';
import { useCalendarStore } from '@/lib/stores/calendar';
import { useOperatorsStore } from '@/lib/stores/operators';
import { Button } from '@/lib/components/shared/ui/Button';
import { Portal } from '@/lib/components/shared/ui/Portal';
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

interface OperatorFilterButtonProps {
  onAddFerie?: (operator: Operator) => void;
}

export function OperatorFilterButton({ onAddFerie }: OperatorFilterButtonProps = {}) {
  const operators = useOperatorsStore((s) => s.operators);
  const selectedOperatorIds = useCalendarStore((s) => s.selectedOperatorIds);
  const focusedOperatorId = useCalendarStore((s) => s.focusedOperatorId);
  const setSelectedOperatorIds = useCalendarStore((s) => s.setSelectedOperatorIds);
  const setFocusedOperatorId = useCalendarStore((s) => s.setFocusedOperatorId);

  const [open, setOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ operator: Operator; x: number; y: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  const activeOperators = useMemo(
    () => operators.filter((op) => !op.isArchived),
    [operators],
  );

  const effectiveDayIds = useMemo(() => {
    if (selectedOperatorIds === null) return new Set(activeOperators.map((o) => o.id));
    return new Set(selectedOperatorIds);
  }, [selectedOperatorIds, activeOperators]);

  const allSelected = selectedOperatorIds === null;

  // Position the panel below-right of the trigger button.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const r = triggerRef.current!.getBoundingClientRect();
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
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
    if (activeOperators.length > 0) {
      const stillActive = focusedOperatorId && activeOperators.some((op) => op.id === focusedOperatorId);
      if (!stillActive) setFocusedOperatorId(activeOperators[0].id);
    }
  }

  function isolate(operatorId: string) {
    setSelectedOperatorIds([operatorId]);
    setFocusedOperatorId(operatorId);
  }

  function toggleMembership(operatorId: string) {
    const allActiveIds = activeOperators.map((o) => o.id);
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

  if (activeOperators.length === 0) return null;

  return (
    <>
      <div className="relative">
        <Button
          ref={triggerRef}
          variant="ghost"
          size="sm"
          iconOnly
          aria-label="Filtra operatori"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <Users />
        </Button>
        {!allSelected && (
          <span
            aria-hidden
            className="absolute top-0.5 right-0.5 size-2 rounded-full bg-primary pointer-events-none"
          />
        )}
      </div>

      {open && pos && (
        <Portal>
          <div
            ref={panelRef}
            className="fixed w-56 bg-white dark:bg-zinc-800 border border-zinc-500/25 rounded-lg shadow-lg z-dropdown overflow-hidden py-1"
            style={{ top: pos.top, right: pos.right }}
          >
            {/* Select-all row */}
            <button
              type="button"
              onClick={selectAll}
              className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-sm text-zinc-700 dark:text-zinc-300"
            >
              <RowCheckbox checked={allSelected} />
              <span className="grow text-left font-medium">Tutti gli operatori</span>
            </button>

            <div className="border-t border-zinc-500/15 mx-3 my-0.5" />

            {/* Per-operator rows */}
            {activeOperators.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => toggleMembership(op.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ operator: op, x: e.clientX, y: e.clientY });
                }}
                className="flex w-full items-center gap-3 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-sm text-zinc-700 dark:text-zinc-300"
              >
                <OperatorAvatar operator={op} />
                <span className="grow text-left truncate">{op.getFullName()}</span>
                <RowCheckbox checked={effectiveDayIds.has(op.id)} />
              </button>
            ))}
          </div>
        </Portal>
      )}

      {/* Right-click context menu */}
      {contextMenu && (
        <Portal>
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed z-popover min-w-44 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden text-sm"
            style={{ left: Math.min(contextMenu.x, window.innerWidth - 200), top: Math.min(contextMenu.y, window.innerHeight - 100) }}
          >
            <button
              type="button"
              onClick={() => { isolate(contextMenu.operator.id); setContextMenu(null); }}
              className="flex w-full items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
            >
              <Crosshair className="size-4" />
              Isola
            </button>
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
