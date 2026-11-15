'use client';

import type { ReactNode } from 'react';
import { Reorder, useDragControls, useReducedMotion } from 'motion/react';
import { Check, GripVertical } from 'lucide-react';
import { ListRow } from '@/lib/components/shared/ui/list/ListBox';
import { cn } from '@/lib/utils';

interface ReorderListRowProps {
  /** The id this row stands for in the surrounding <Reorder.Group>. */
  value: string;
  selected: boolean;
  onActivate: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  className?: string;
  children: ReactNode;
}

/**
 * A ListRow that is also a drag item: drag by the grip, click / Enter / Space
 * to toggle. Shared by the table column picker and the calendar operator
 * filter. Put it inside a <ListBox> and a <Reorder.Group>.
 */
export function ReorderListRow({ value, selected, onActivate, onContextMenu, className, children }: ReorderListRowProps) {
  const controls = useDragControls();
  const reduceMotion = useReducedMotion();
  return (
    <ListRow asChild selected={selected} onClick={onActivate}>
      <Reorder.Item
        as="div"
        value={value}
        dragListener={false}
        dragControls={controls}
        tabIndex={0}
        onContextMenu={onContextMenu}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onActivate();
          }
        }}
        // While dragged the row needs its own floating surface over the rows it passes.
        whileDrag={reduceMotion ? undefined : { scale: 1.01, boxShadow: 'var(--lume-shadow-float)', backgroundColor: 'var(--lume-surface-raised)' }}
        className={cn('select-none', className)}
      >
        <span
          aria-hidden
          className="text-[var(--lume-text-muted)] cursor-grab active:cursor-grabbing shrink-0 touch-none"
          onPointerDown={(e) => {
            e.preventDefault();
            controls.start(e);
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="size-4" />
        </span>
        {children}
        {/* asChild rows don't get ListRow's own check, so draw it here. */}
        <Check aria-hidden className={cn('size-4 shrink-0 text-[var(--lume-text)]', selected ? 'opacity-100' : 'opacity-0')} />
      </Reorder.Item>
    </ListRow>
  );
}
