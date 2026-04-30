'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Placement = 'top' | 'bottom' | 'left' | 'right';
type Align = 'start' | 'center' | 'end';

interface HoverPopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  placement?: Placement;
  align?: Align;
  contentClassName?: string;
  triggerClassName?: string;
  onTriggerClick?: () => void;
  /** Gap (px) between trigger and popover. */
  offset?: number;
}

const GAP = 6;

export function HoverPopover({
  trigger,
  content,
  placement = 'bottom',
  align = 'start',
  contentClassName = '',
  triggerClassName = '',
  onTriggerClick,
  offset = GAP,
}: HoverPopoverProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const popoverRef = useRef<HTMLSpanElement | null>(null);
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
      let top = 0;
      let left = 0;

      if (placement === 'top' || placement === 'bottom') {
        top = placement === 'top' ? t.top - p.height - offset : t.bottom + offset;
        if (align === 'start') left = t.left;
        else if (align === 'end') left = t.right - p.width;
        else left = t.left + t.width / 2 - p.width / 2;
      } else {
        left = placement === 'left' ? t.left - p.width - offset : t.right + offset;
        if (align === 'start') top = t.top;
        else if (align === 'end') top = t.bottom - p.height;
        else top = t.top + t.height / 2 - p.height / 2;
      }

      // Keep within viewport
      const margin = 4;
      left = Math.max(margin, Math.min(left, window.innerWidth - p.width - margin));
      top = Math.max(margin, Math.min(top, window.innerHeight - p.height - margin));

      setCoords({ top, left });
    };

    compute();
    window.addEventListener('scroll', compute, true);
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('scroll', compute, true);
      window.removeEventListener('resize', compute);
    };
  }, [open, placement, align, offset]);

  useEffect(() => () => cancelClose(), []);

  const portalTarget = typeof document !== 'undefined' ? document.body : null;

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
      {open && portalTarget && createPortal(
        <span
          ref={popoverRef}
          role="tooltip"
          style={{
            position: 'fixed',
            top: coords?.top ?? -9999,
            left: coords?.left ?? -9999,
            visibility: coords ? 'visible' : 'hidden',
          }}
          className={`z-50 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 shadow-lg rounded-md border border-zinc-200 dark:border-zinc-700 p-3 min-w-[220px] ${contentClassName}`}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {content}
        </span>,
        portalTarget,
      )}
    </span>
  );
}
