'use client';

import { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { EllipsisVertical } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button } from './Button';
import { Portal } from './Portal';
import { NumberBadge } from './NumberBadge';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface DropdownMenuAction {
  label: string;
  icon: React.ComponentType<any>;
  onClick: () => void;
  destructive?: boolean;
  badge?: number;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export type DropdownMenuItem = DropdownMenuAction | { divider: true };

function isDivider(item: DropdownMenuItem): item is { divider: true } {
  return 'divider' in item;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  width?: string;
  ariaLabel?: string;
}

export function DropdownMenu({ items, width = 'w-64', ariaLabel = 'Altre azioni' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const reduceMotion = useReducedMotion();

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

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <>
      <Button
        ref={triggerRef}
        variant="secondary"
        size="md"
        iconOnly
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <EllipsisVertical />
      </Button>
      <AnimatePresence>
        {open && pos && (
          <Portal>
            <motion.div
              ref={panelRef}
              role="menu"
              className={`fixed ${width} bg-popover text-popover-foreground border border-border rounded-lg shadow-lg z-dropdown p-1`}
              style={{ top: pos.top, right: pos.right, transformOrigin: '100% 0%' }}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6 }}
              transition={{
                duration: reduceMotion ? 0.12 : 0.18,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {items.flatMap<DropdownMenuItem>((item, i) => {
                if (isDivider(item)) return [item];
                const prev = items[i - 1];
                const needsDivider = !!item.destructive && !!prev && !isDivider(prev) && !prev.destructive;
                return needsDivider ? [{ divider: true }, item] : [item];
              }).map((item, i) => {
                if (isDivider(item)) {
                  return <div key={`div-${i}`} className="my-1 border-t border-border" aria-hidden />;
                }
                return (
                  <button
                    key={item.label}
                    role="menuitem"
                    className={
                      item.destructive
                        ? 'flex flex-row items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-left text-[var(--lume-danger-fg)] hover:bg-[var(--lume-danger-bg)] transition-colors'
                        : 'flex flex-row items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-left text-foreground hover:bg-muted/60 transition-colors'
                    }
                    onClick={() => { item.onClick(); setOpen(false); }}
                  >
                    <item.icon
                      className={item.destructive ? 'size-4' : 'size-4 text-muted-foreground'}
                    />
                    <span className="grow">{item.label}</span>
                    {item.badge !== undefined && (
                      <NumberBadge value={item.badge} variant="neutral" size="md" className="ml-auto" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </>
  );
}
