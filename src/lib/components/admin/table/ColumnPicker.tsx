'use client';

import { useMemo, useRef } from 'react';
import { AnimatePresence, Reorder } from 'motion/react';
import { Columns3, RotateCcw } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/lib/components/shared/ui/Button';
import { NumberBadge } from '@/lib/components/shared/ui/NumberBadge';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { FloatingPanel } from '@/lib/components/shared/ui/FloatingPanel';
import { ListBox, ListRow, ListGroupLabel, ListSeparator } from '@/lib/components/shared/ui/list/ListBox';
import { useAnchoredPopover } from '@/lib/hooks/useAnchoredPopover';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { ReorderListRow } from './ReorderListRow';
import { cn } from '@/lib/utils';

const PANEL_WIDTH = 288;

interface ColumnPickerProps<T> {
  tableId: string;
  columns: ColumnDef<T>[];
}

export function ColumnPicker<T>({ tableId, columns }: ColumnPickerProps<T>) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { open, toggle: togglePanel, position, panelRef, side } = useAnchoredPopover(triggerRef, {
    panelMaxHeight: 400,
    offset: 6,
    align: 'end',
    panelWidth: PANEL_WIDTH,
  });

  const {
    columns: meta,
    columnOrder,
    columnVisibility,
    setColumnOrder,
    setColumnVisibility,
    resetToDefault,
  } = useTableColumnPrefs(tableId, columns);

  const metaById = useMemo(() => new Map(meta.map((c) => [c.id, c])), [meta]);

  const visibleIds = useMemo(
    () => columnOrder.filter((id) => {
      const info = metaById.get(id);
      return !info?.lockedInPicker && info?.pinned !== 'start';
    }),
    [columnOrder, metaById],
  );

  const hiddenCount = useMemo(
    () => meta.filter((c) => !c.lockedInPicker && !c.requiredVisible && columnVisibility[c.id] === false).length,
    [meta, columnVisibility],
  );

  const isHidden = (id: string) => columnVisibility[id] === false;

  const onReorder = (next: string[]) => {
    const pinnedHead = columnOrder.filter((id) => metaById.get(id)?.pinned === 'start');
    const lockedTail = columnOrder.filter((id) => metaById.get(id)?.lockedInPicker);
    setColumnOrder([...pinnedHead, ...next, ...lockedTail]);
  };

  const toggle = (id: string) => {
    const info = metaById.get(id);
    if (!info || info.requiredVisible || info.lockedInPicker) return;
    const nextHidden = !isHidden(id);
    setColumnVisibility({ ...columnVisibility, [id]: !nextHidden });
  };

  const resolveLabel = (id: string) => metaById.get(id)?.label ?? id;

  return (
    <div className="relative">
      <Button
        ref={triggerRef}
        variant="secondary"
        size="md"
        leadingIcon={Columns3}
        aria-haspopup="listbox"
        aria-expanded={open}
        pressed={hiddenCount > 0}
        onClick={togglePanel}
      >
        <span>Colonne</span>
        {hiddenCount > 0 && <NumberBadge value={hiddenCount} variant="strong" />}
      </Button>

      <Portal>
        <AnimatePresence>
          {open && position && (
            <FloatingPanel
              ref={panelRef}
              side={side}
              layer="dropdown"
              style={{
                position: 'fixed',
                left: Math.max(16, Math.min(position.left, window.innerWidth - PANEL_WIDTH - 16)),
                top: position.top,
                bottom: position.bottom,
                width: PANEL_WIDTH,
              }}
            >
              <ListGroupLabel className="px-4 pt-3">Colonne visibili</ListGroupLabel>
              {/* Multi-select: rows show a check, not a fill. Only the columns scroll. */}
              <ListBox role="listbox" multiple aria-label="Colonne visibili">
                <Reorder.Group
                  as="div"
                  axis="y"
                  values={visibleIds}
                  onReorder={onReorder}
                  className="flex flex-col gap-px max-h-80 overflow-y-auto overflow-x-hidden"
                >
                  {visibleIds.map((id) => {
                    const info = metaById.get(id);
                    if (!info) return null;
                    return (
                      <ReorderListRow
                        key={id}
                        value={id}
                        selected={!isHidden(id) || !!info.requiredVisible}
                        onActivate={() => toggle(id)}
                      >
                        <span className={cn('flex-1 truncate', isHidden(id) && !info.requiredVisible && 'text-[var(--lume-text-muted)] line-through')}>
                          {resolveLabel(id)}
                        </span>
                        {info.requiredVisible && <span className="text-2xs font-normal text-[var(--lume-text-muted)]">sempre</span>}
                      </ReorderListRow>
                    );
                  })}
                </Reorder.Group>
              </ListBox>
              <ListSeparator className="mx-3" />
              <ListBox className="pt-0">
                <ListRow icon={RotateCcw} onClick={resetToDefault}>Ripristina default</ListRow>
              </ListBox>
            </FloatingPanel>
          )}
        </AnimatePresence>
      </Portal>
    </div>
  );
}
