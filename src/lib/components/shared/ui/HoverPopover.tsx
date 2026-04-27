'use client';

import { useRef, useState, type ReactNode } from 'react';

interface HoverPopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  placement?: 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
  contentClassName?: string;
  triggerClassName?: string;
  onTriggerClick?: () => void;
}

export function HoverPopover({
  trigger,
  content,
  placement = 'bottom',
  align = 'start',
  contentClassName = '',
  triggerClassName = '',
  onTriggerClick,
}: HoverPopoverProps) {
  const [open, setOpen] = useState(false);
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

  const placementClass = placement === 'top'
    ? 'bottom-full mb-1'
    : 'top-full mt-1';

  const alignClass = align === 'end'
    ? 'right-0'
    : align === 'center'
      ? 'left-1/2 -translate-x-1/2'
      : 'left-0';

  return (
    <span className="relative inline-flex">
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
      {open && (
        <span
          role="tooltip"
          className={`absolute z-30 ${placementClass} ${alignClass} bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 shadow-lg rounded-md border border-zinc-200 dark:border-zinc-700 p-3 min-w-[220px] ${contentClassName}`}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {content}
        </span>
      )}
    </span>
  );
}
