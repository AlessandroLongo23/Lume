'use client';

import { useRef } from 'react';
import { EllipsisVertical } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { Button } from './Button';
import { Portal } from './Portal';
import { NumberBadge } from './NumberBadge';
import { FloatingPanel } from './FloatingPanel';
import { ListBox, ListRow, ListSeparator } from './list/ListBox';
import { useAnchoredPopover } from '@/lib/hooks/useAnchoredPopover';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface DropdownMenuItem {
  label: string;
  icon: React.ComponentType<any>;
  onClick: () => void;
  destructive?: boolean;
  badge?: number;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const PANEL_WIDTH = 256;
const LABEL = 'Altre azioni';

/**
 * The "⋯" actions menu: a <FloatingPanel> holding a <ListBox role="menu">.
 * Destructive actions go last and are set apart by a separator, added here.
 */
export function DropdownMenu({ items }: { items: DropdownMenuItem[] }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { open, toggle, hide, position, panelRef, side } = useAnchoredPopover(triggerRef, {
    panelMaxHeight: items.length * 40 + 16,
    offset: 8,
    align: 'end',
    panelWidth: PANEL_WIDTH,
  });

  return (
    <>
      <Button
        ref={triggerRef}
        variant="secondary"
        size="md"
        iconOnly
        aria-label={LABEL}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      >
        <EllipsisVertical />
      </Button>
      <Portal>
        <AnimatePresence>
          {open && position && (
            <FloatingPanel
              ref={panelRef}
              side={side}
              layer="dropdown"
              style={{ position: 'fixed', left: position.left, top: position.top, bottom: position.bottom, width: PANEL_WIDTH }}
            >
              <ListBox role="menu" aria-label={LABEL}>
                {items.flatMap((item, i) => {
                  const prev = items[i - 1];
                  const row = (
                    <ListRow
                      key={item.label}
                      icon={item.icon}
                      destructive={item.destructive}
                      trailing={item.badge !== undefined ? <NumberBadge value={item.badge} variant="neutral" size="md" /> : undefined}
                      onClick={() => { item.onClick(); hide(); }}
                    >
                      {item.label}
                    </ListRow>
                  );
                  return item.destructive && prev && !prev.destructive
                    ? [<ListSeparator key={`sep-${item.label}`} />, row]
                    : [row];
                })}
              </ListBox>
            </FloatingPanel>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
