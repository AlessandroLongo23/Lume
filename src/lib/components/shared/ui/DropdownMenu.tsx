'use client';

import { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { EllipsisVertical } from 'lucide-react';
import { Button } from './Button';
import { Portal } from './Portal';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface DropdownMenuItem {
  label: string;
  icon: React.ComponentType<any>;
  onClick: () => void;
  destructive?: boolean;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  width?: string;
}

export function DropdownMenu({ items, width = 'w-48' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

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

  return (
    <>
      <Button
        ref={triggerRef}
        variant="secondary"
        size="md"
        iconOnly
        aria-label="Altre opzioni"
        onClick={() => setOpen((v) => !v)}
      >
        <EllipsisVertical />
      </Button>
      {open && pos && (
        <Portal>
          <div
            ref={panelRef}
            className={`fixed ${width} bg-white dark:bg-zinc-800 border border-zinc-500/25 rounded-lg shadow-lg z-dropdown py-1`}
            style={{ top: pos.top, right: pos.right }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                className={
                  item.destructive
                    ? "flex flex-row items-center gap-3 w-full px-4 py-2.5 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    : "flex flex-row items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-zinc-700 dark:text-zinc-300"
                }
                onClick={() => { item.onClick(); setOpen(false); }}
              >
                <item.icon className={item.destructive ? "size-4 text-red-500" : "size-4 text-zinc-400"} />
                {item.label}
              </button>
            ))}
          </div>
        </Portal>
      )}
    </>
  );
}
