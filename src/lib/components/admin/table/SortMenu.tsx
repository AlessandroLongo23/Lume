'use client';

import { useRef } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { Button } from '@/lib/components/shared/ui/Button';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { FloatingPanel } from '@/lib/components/shared/ui/FloatingPanel';
import { ListBox, ListRow } from '@/lib/components/shared/ui/list/ListBox';
import { useAnchoredPopover } from '@/lib/hooks/useAnchoredPopover';

interface SortMenuProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

const PANEL_WIDTH = 256;

export function SortMenu<T extends string>({ options, value, onChange }: SortMenuProps<T>) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { open, toggle, hide, position, panelRef, side } = useAnchoredPopover(triggerRef, {
    panelMaxHeight: options.length * 40 + 16,
    offset: 6,
    panelWidth: PANEL_WIDTH,
  });

  const current = options.find((o) => o.value === value);


  return (
    <>
      <Button
        ref={triggerRef}
        variant="secondary"
        size="md"
        leadingIcon={ArrowUpDown}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      >
        <span className="text-[var(--lume-text-secondary)] font-normal">Ordina:</span> {current?.label}
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
              <ListBox role="menu" aria-label="Ordina">
                {options.map((opt) => {
                  const checked = opt.value === value;
                  return (
                    <ListRow
                      key={opt.value}
                      role="menuitemradio"
                      aria-checked={checked}
                      selected={checked}
                      check
                      onClick={() => { onChange(opt.value); hide(); }}
                    >
                      {opt.label}
                    </ListRow>
                  );
                })}
              </ListBox>
            </FloatingPanel>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
