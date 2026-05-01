'use client';

import { type ReactElement } from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';

type Side = 'top' | 'right' | 'bottom' | 'left';

interface TooltipProps {
  /** Tooltip text. When empty/undefined, the wrapper is a no-op and `children` render unchanged. */
  label?: string;
  shortcut?: string;
  side?: Side;
  sideOffset?: number;
  delay?: number;
  children: ReactElement;
}

export function Tooltip({
  label,
  shortcut,
  side = 'top',
  sideOffset = 8,
  delay = 400,
  children,
}: TooltipProps) {
  if (!label) return children;
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger delay={delay} render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={sideOffset}>
          <BaseTooltip.Popup className="flex items-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-200 shadow-md z-tooltip">
            <span>{label}</span>
            {shortcut && (
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-500 font-sans">
                {shortcut}
              </kbd>
            )}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
