'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Reorder } from 'motion/react';
import { Columns3, GripVertical, Check, RotateCcw } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { NumberBadge } from '@/lib/components/shared/ui/NumberBadge';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';

interface ColumnPickerProps<T> {
  tableId: string;
  columns: ColumnDef<T>[];
  labels?: Record<string, string>;
  className?: string;
}

export function ColumnPicker<T>({ tableId, columns, labels, className }: ColumnPickerProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const {
    columns: meta,
    columnOrder,
    columnVisibility,
    setColumnOrder,
    setColumnVisibility,
    resetToDefault,
  } = useTableColumnPrefs(tableId, columns);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', esc);
    };
  }, []);

  const metaById = useMemo(() => new Map(meta.map((c) => [c.id, c])), [meta]);

  const visibleIds = useMemo(
    () => columnOrder.filter((id) => !metaById.get(id)?.lockedInPicker),
    [columnOrder, metaById],
  );

  const hiddenCount = useMemo(
    () => meta.filter((c) => !c.lockedInPicker && !c.requiredVisible && columnVisibility[c.id] === false).length,
    [meta, columnVisibility],
  );

  const isHidden = (id: string) => columnVisibility[id] === false;

  const onReorder = (next: string[]) => {
    const lockedTail = columnOrder.filter((id) => metaById.get(id)?.lockedInPicker);
    setColumnOrder([...next, ...lockedTail]);
  };

  const toggle = (id: string) => {
    const info = metaById.get(id);
    if (!info || info.requiredVisible || info.lockedInPicker) return;
    const nextHidden = !isHidden(id);
    setColumnVisibility({ ...columnVisibility, [id]: !nextHidden });
  };

  const resolveLabel = (id: string) => labels?.[id] ?? metaById.get(id)?.label ?? id;

  return (
    <div ref={ref} className={['relative', className].filter(Boolean).join(' ')}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={[
          'flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors',
          hiddenCount > 0
            ? 'bg-primary/10 border-primary/30 text-primary-hover dark:text-primary/70'
            : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
        ].join(' ')}
      >
        <Columns3 className="size-4" />
        <span>Colonne</span>
        {hiddenCount > 0 && <NumberBadge value={hiddenCount} variant="solid" size="md" />}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 z-dropdown w-72 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Colonne visibili</span>
          </div>

          <Reorder.Group
            axis="y"
            values={visibleIds}
            onReorder={onReorder}
            className="py-1 max-h-80 overflow-y-auto overflow-x-hidden"
          >
            {visibleIds.map((id) => {
              const info = metaById.get(id);
              if (!info) return null;
              const checked = !isHidden(id) || info.requiredVisible;
              const checkboxDisabled = info.requiredVisible;
              return (
                <Reorder.Item
                  key={id}
                  value={id}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  whileDrag={{ scale: 1.01, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                >
                  <span className="text-zinc-300 dark:text-zinc-600 cursor-grab active:cursor-grabbing">
                    <GripVertical className="size-4" />
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    disabled={checkboxDisabled}
                    aria-label={checked ? 'Nascondi' : 'Mostra'}
                    className={[
                      'shrink-0 size-4 rounded border transition-colors flex items-center justify-center',
                      checked ? 'bg-primary border-primary' : 'border-zinc-300 dark:border-zinc-600',
                      checkboxDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                    ].join(' ')}
                  >
                    {checked && <Check className="size-3 text-white" />}
                  </button>
                  <span
                    className={[
                      'flex-1 truncate text-zinc-700 dark:text-zinc-300',
                      !checked ? 'text-zinc-400 dark:text-zinc-600 line-through' : '',
                    ].join(' ')}
                  >
                    {resolveLabel(id)}
                  </span>
                  {info.requiredVisible && (
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
                      sempre
                    </span>
                  )}
                </Reorder.Item>
              );
            })}
          </Reorder.Group>

          <div className="px-3 py-1.5 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <button
              type="button"
              onClick={resetToDefault}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <RotateCcw className="size-3" />
              Ripristina default
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
