'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpDown, Check } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button } from '@/lib/components/shared/ui/Button';
import { Portal } from '@/lib/components/shared/ui/Portal';

interface SortMenuProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SortMenu<T extends string>({ options, value, onChange }: SortMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const reduceMotion = useReducedMotion();

  const current = options.find((o) => o.value === value);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const r = triggerRef.current!.getBoundingClientRect();
      setPos({ top: r.bottom + 8, left: r.left });
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
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <Button
        ref={triggerRef}
        variant="secondary"
        size="md"
        leadingIcon={ArrowUpDown}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="whitespace-nowrap"
      >
        <span className="text-muted-foreground">Ordina:</span> {current?.label}
      </Button>
      <AnimatePresence>
        {open && pos && (
          <Portal>
            <motion.div
              ref={panelRef}
              role="menu"
              aria-label="Ordina"
              className="fixed w-64 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg z-dropdown p-1"
              style={{ top: pos.top, left: pos.left, transformOrigin: '0% 0%' }}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6 }}
              transition={{
                duration: reduceMotion ? 0.12 : 0.18,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {options.map((opt) => {
                const checked = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    role="menuitemradio"
                    aria-checked={checked}
                    className="flex flex-row items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-left text-foreground hover:bg-muted/60 transition-colors"
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                  >
                    <span className="grow">{opt.label}</span>
                    {checked && <Check className="size-4 text-muted-foreground" />}
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
