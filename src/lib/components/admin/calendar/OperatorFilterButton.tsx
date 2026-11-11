'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Ban, Crosshair, Users } from 'lucide-react';
import { AnimatePresence, Reorder } from 'motion/react';
import { useCalendarStore } from '@/lib/stores/calendar';
import { Button } from '@/lib/components/shared/ui/Button';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { FloatingPanel } from '@/lib/components/shared/ui/FloatingPanel';
import { ListBox, ListRow, ListSeparator } from '@/lib/components/shared/ui/list/ListBox';
import { useAnchoredPopover } from '@/lib/hooks/useAnchoredPopover';
import { ReorderListRow } from '@/lib/components/admin/table/ReorderListRow';
import { useOperatorOrder } from '@/lib/hooks/useOperatorOrder';
import type { Operator } from '@/lib/types/Operator';

/** Round operator photo, or the first initial on a neutral fill. Also used by the day-view column headers. */
export function OperatorAvatar({ operator, size = 28 }: { operator: Operator; size?: number }) {
  if (operator.avatar_url) {
    return (
      <span
        className="block rounded-full overflow-hidden bg-active shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src={operator.avatar_url}
          alt=""
          width={size}
          height={size}
          className="size-full object-cover"
          draggable={false}
        />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={`rounded-full bg-active flex items-center justify-center font-medium text-[var(--lume-text-secondary)] select-none shrink-0 ${size <= 24 ? 'text-2xs' : 'text-xs'}`}
      style={{ width: size, height: size }}
    >
      {(operator.firstName?.[0] ?? '·').toUpperCase()}
    </span>
  );
}

const PANEL_WIDTH = 256;

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

  const [contextMenu, setContextMenu] = useState<{ operator: Operator; x: number; y: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { open, toggle, hide, position, panelRef, side } = useAnchoredPopover(triggerRef, {
    panelMaxHeight: 400,
    offset: 8,
    align: 'end',
    panelWidth: PANEL_WIDTH,
  });

  const effectiveDayIds = useMemo(() => {
    if (selectedOperatorIds === null) return new Set(orderedOperators.map((o) => o.id));
    return new Set(selectedOperatorIds);
  }, [selectedOperatorIds, orderedOperators]);

  const allSelected = selectedOperatorIds === null;

  // Close context menu on outside click / scroll / Escape. The panel's own
  // Escape is useAnchoredPopover's (document, capture); this one listens on
  // window in the capture phase, so it runs first and closes only the menu.
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      close();
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', esc, true);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', esc, true);
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
      <div data-tour="calendar-operator-filter" className="relative">
        <Button
          ref={triggerRef}
          variant="secondary"
          iconOnly
          aria-label="Filtra operatori"
          aria-haspopup="listbox"
          aria-expanded={open}
          pressed={!isWeek && !allSelected}
          onClick={toggle}
        >
          <Users />
        </Button>
        {!isWeek && !allSelected && (
          <span
            aria-hidden
            className="absolute top-1 right-1 size-1.5 rounded-full bg-[var(--lume-text)] pointer-events-none"
          />
        )}
      </div>

      <Portal>
        <AnimatePresence>
          {open && position && (
            <FloatingPanel
              ref={panelRef}
              side={side}
              layer="dropdown"
              style={{ position: 'fixed', left: position.left, top: position.top, bottom: position.bottom, width: PANEL_WIDTH }}
            >
              <ListBox
                role="listbox"
                // Day/month: several operators (rows show a check); week: one.
                multiple={!isWeek}
                aria-label={isWeek ? 'Operatore visibile' : 'Operatori visibili'}
                className="max-h-96 overflow-y-auto overflow-x-hidden"
              >
                {/* Select-all row, only in multi-select (day/month) view */}
                {!isWeek && (
                  <>
                    <ListRow selected={allSelected} icon={Users} onClick={selectAll}>
                      Tutti gli operatori
                    </ListRow>
                    <ListSeparator />
                  </>
                )}

                {/* Per-operator rows, drag to reorder via the grip handle */}
                <Reorder.Group as="div" axis="y" values={orderedIds} onReorder={setOrder} className="flex flex-col gap-px">
                  {orderedOperators.map((op) => {
                    const checked = isWeek ? focusedOperatorId === op.id : effectiveDayIds.has(op.id);
                    return (
                      <ReorderListRow
                        key={op.id}
                        value={op.id}
                        selected={checked}
                        className="pl-2"
                        onActivate={() => {
                          if (isWeek) {
                            setFocusedOperatorId(op.id);
                            hide();
                          } else {
                            toggleMembership(op.id);
                          }
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({ operator: op, x: e.clientX, y: e.clientY });
                        }}
                      >
                        <OperatorAvatar operator={op} />
                        <span className="grow truncate">{op.getFullName()}</span>
                      </ReorderListRow>
                    );
                  })}
                </Reorder.Group>
              </ListBox>
            </FloatingPanel>
          )}
        </AnimatePresence>
      </Portal>

      {/* Right-click context menu */}
      <Portal>
        <AnimatePresence>
          {contextMenu && (
            <FloatingPanel
              layer="popover"
              onMouseDown={(e) => e.stopPropagation()}
              className="min-w-44"
              style={{
                position: 'fixed',
                left: Math.min(contextMenu.x, window.innerWidth - 200),
                top: Math.min(contextMenu.y, window.innerHeight - 100),
              }}
            >
              <ListBox role="menu" aria-label={contextMenu.operator.getFullName()}>
                {!isWeek && (
                  <ListRow icon={Crosshair} onClick={() => { isolate(contextMenu.operator.id); setContextMenu(null); }}>
                    Isola
                  </ListRow>
                )}
                {onAddFerie && (
                  <ListRow icon={Ban} onClick={() => { onAddFerie(contextMenu.operator); setContextMenu(null); hide(); }}>
                    Aggiungi ferie
                  </ListRow>
                )}
              </ListBox>
            </FloatingPanel>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
