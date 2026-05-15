'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { ClientColorPicker } from './ClientColorPicker';
import { colorForClient } from '@/lib/utils/clientColor';

interface ClientColorDotProps {
  clientId: string;
  /** Current explicit color override (null = auto). */
  color: string | null;
  /** Called when the user picks a swatch or resets to auto. */
  onChange: (color: string | null) => void | Promise<void>;
  /** Render size in px. Default 12. */
  size?: number;
  /** Accessible label for the trigger. */
  ariaLabel?: string;
}

/**
 * Small clickable color dot for a client. Click opens a popover with the
 * 12-swatch palette + a "reset to auto" affordance. Used in the calendar
 * fiche block header so staff can change a client's color in one gesture.
 */
export function ClientColorDot({
  clientId,
  color,
  onChange,
  size = 12,
  ariaLabel = 'Cambia colore cliente',
}: ClientColorDotProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();

  const displayed = colorForClient({ id: clientId, color });

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const r = triggerRef.current!.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
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
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerDown={(e) => {
          // Calendar fiche-block header uses pointerdown to start a drag —
          // stop it here so the dot click never turns into a move.
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="shrink-0 rounded-full ring-1 ring-black/15 dark:ring-white/20 hover:ring-2 hover:ring-zinc-400 transition-[box-shadow] cursor-pointer"
        style={{ width: size, height: size, backgroundColor: displayed }}
      />
      <AnimatePresence>
        {open && pos && (
          <Portal>
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-label="Colore cliente"
              className="fixed z-dropdown bg-popover text-popover-foreground border border-border rounded-lg shadow-lg p-3"
              style={{ top: pos.top, left: pos.left, transformOrigin: '0% 0%' }}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6 }}
              transition={{ duration: reduceMotion ? 0.12 : 0.16, ease: [0.22, 1, 0.36, 1] }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <ClientColorPicker
                value={color}
                onChange={(next) => {
                  void onChange(next);
                  setOpen(false);
                }}
                clientId={clientId}
              />
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </>
  );
}
