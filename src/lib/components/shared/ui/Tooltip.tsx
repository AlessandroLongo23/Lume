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
  /** Overrides the app-wide delay set by `UiProviders`. */
  delay?: number;
  children: ReactElement;
}

export function Tooltip({
  label,
  shortcut,
  side = 'top',
  sideOffset = 8,
  delay,
  children,
}: TooltipProps) {
  if (!label) return children;
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger delay={delay} render={children} />
      <BaseTooltip.Portal>
        {/* The layer goes on the Positioner: the Popup is static inside it, so a
            z-index there has no effect. */}
        <BaseTooltip.Positioner side={side} sideOffset={sideOffset} className="z-tooltip">
          <BaseTooltip.Popup
            className={[
              'flex items-center gap-2 rounded-md border border-[var(--lume-border-tooltip)] bg-[var(--lume-surface-raised)]',
              'px-2 py-1 text-xs text-[var(--lume-text)] shadow-md',
              'origin-(--transform-origin) transition-[opacity,scale] duration-[var(--duration-fast)] ease-[var(--ease-out)]',
              'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
              'motion-safe:data-[starting-style]:scale-95 motion-safe:data-[ending-style]:scale-95',
              // Inside a delay group the next tooltip swaps in place, without a fade.
              'data-[instant]:transition-none',
            ].join(' ')}
          >
            <span>{label}</span>
            {shortcut && (
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--lume-surface)] border border-[var(--lume-border)] text-2xs text-[var(--lume-text-muted)] font-sans">
                {shortcut}
              </kbd>
            )}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
