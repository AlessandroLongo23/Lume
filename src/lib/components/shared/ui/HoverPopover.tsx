'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence } from 'motion/react';
import { Portal } from './Portal';
import { FloatingPanel } from './FloatingPanel';

interface HoverPopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  triggerClassName?: string;
  onTriggerClick?: () => void;
}

/** Gap (px) between trigger and card; viewport margin it keeps. */
const GAP = 6;
const MARGIN = 4;

/**
 * A small card that opens under its trigger while the pointer rests on it and
 * stays open while the pointer moves into it. The surface and motion are
 * FloatingPanel's.
 */
export function HoverPopover({ trigger, content, triggerClassName = '', onTriggerClick }: HoverPopoverProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  useLayoutEffect(() => {
    if (!open) return;
    const trigEl = triggerRef.current;
    const popEl = popoverRef.current;
    if (!trigEl || !popEl) return;

    const compute = () => {
      const t = trigEl.getBoundingClientRect();
      const p = popEl.getBoundingClientRect();
      setCoords({
        top: Math.max(MARGIN, Math.min(t.bottom + GAP, window.innerHeight - p.height - MARGIN)),
        left: Math.max(MARGIN, Math.min(t.left, window.innerWidth - p.width - MARGIN)),
      });
    };

    compute();
    window.addEventListener('scroll', compute, true);
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('scroll', compute, true);
      window.removeEventListener('resize', compute);
    };
  }, [open]);

  useEffect(() => () => cancelClose(), []);

  return (
    <span ref={triggerRef} className="relative inline-flex">
      <span
        className={triggerClassName}
        onMouseEnter={() => { cancelClose(); setOpen(true); }}
        onMouseLeave={scheduleClose}
        onClick={(e) => {
          if (!onTriggerClick) return;
          e.stopPropagation();
          onTriggerClick();
        }}
      >
        {trigger}
      </span>
      <Portal>
        <AnimatePresence>
          {open && (
            <FloatingPanel
              ref={popoverRef}
              role="tooltip"
              style={{
                position: 'fixed',
                top: coords?.top ?? -9999,
                left: coords?.left ?? -9999,
                visibility: coords ? 'visible' : 'hidden',
              }}
              className="p-3 min-w-55"
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
            >
              {content}
            </FloatingPanel>
          )}
        </AnimatePresence>
      </Portal>
    </span>
  );
}
