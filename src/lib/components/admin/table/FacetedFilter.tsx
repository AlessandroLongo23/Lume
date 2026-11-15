'use client';

import { useRef } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { Button } from '@/lib/components/shared/ui/Button';
import { NumberBadge } from '@/lib/components/shared/ui/NumberBadge';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { FloatingPanel } from '@/lib/components/shared/ui/FloatingPanel';
import { ListBox, ListRow, ListGroupLabel, ListEmpty, ListSeparator } from '@/lib/components/shared/ui/list/ListBox';
import { useAnchoredPopover } from '@/lib/hooks/useAnchoredPopover';

export interface FacetedFilterOption {
  value: string;
  label: string;
  prefix?: React.ReactNode;
}

interface FacetedFilterProps {
  label: string;
  options: FacetedFilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const PANEL_WIDTH = 224;

export function FacetedFilter({ label, options, selected, onChange }: FacetedFilterProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { open, toggle: togglePanel, position, panelRef, side } = useAnchoredPopover(triggerRef, {
    panelMaxHeight: 300,
    offset: 6,
    panelWidth: PANEL_WIDTH,
  });

  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  const active = selected.length > 0;

  return (
    <>
      <Button
        ref={triggerRef}
        variant="secondary"
        size="md"
        leadingIcon={SlidersHorizontal}
        aria-haspopup="listbox"
        aria-expanded={open}
        pressed={active}
        onClick={togglePanel}
      >
        <span>{label}</span>
        {active && <NumberBadge value={selected.length} variant="strong" />}
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
              <ListGroupLabel className="px-4 pt-3">{label}</ListGroupLabel>
              {options.length === 0 ? (
                <ListEmpty>Nessuna opzione</ListEmpty>
              ) : (
                <ListBox role="listbox" multiple aria-label={label} className="max-h-56 overflow-y-auto">
                  {options.map((opt) => (
                    <ListRow key={opt.value} selected={selected.includes(opt.value)} onClick={() => toggle(opt.value)}>
                      <span className="inline-flex items-center gap-2 align-middle">
                        {opt.prefix}
                        {opt.label}
                      </span>
                    </ListRow>
                  ))}
                </ListBox>
              )}
              {active && (
                <>
                  <ListSeparator className="mx-3" />
                  <ListBox className="pt-0">
                    <ListRow onClick={() => onChange([])}>Azzera filtri</ListRow>
                  </ListBox>
                </>
              )}
            </FloatingPanel>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
