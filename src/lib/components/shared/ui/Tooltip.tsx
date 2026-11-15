'use client';

import { type ReactElement } from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';

type Side = 'top' | 'right' | 'bottom' | 'left';

interface TooltipProps {
  /** Tooltip text. When empty/undefined, the wrapper is a no-op and `children` render unchanged. */
  label?: string;
  shortcut?: string;
  side?: Side;
  children: ReactElement;
}

export function Tooltip({
  label,
  shortcut,
  side = 'top',
  children,
}: TooltipProps) {
  if (!label) return children;
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        {/* The layer goes on the Positioner: the Popup is static inside it, so a
            z-index there has no effect. */}
        <BaseTooltip.Positioner side={side} sideOffset={8} className="z-tooltip">
          <BaseTooltip.Popup
            className={[
              // Inverted chip: the text colour as the fill reads against any
              // surface in either theme, without a border.
              'flex items-center gap-2 rounded-md bg-[var(--lume-text)] text-[var(--lume-bg)]',
              'px-2 py-1 text-xs font-medium shadow-[var(--shadow-md)]',
              'origin-(--transform-origin) transition-[opacity,scale] duration-[var(--duration-fast)] ease-[var(--ease-out)]',
              'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
              'motion-safe:data-[starting-style]:scale-95 motion-safe:data-[ending-style]:scale-95',
              // Inside a delay group the next tooltip swaps in place, without a fade.
              'data-[instant]:transition-none',
            ].join(' ')}
          >
            <span>{label}</span>
            {shortcut && (
              <kbd className="px-1 py-0.5 rounded-sm bg-[color-mix(in_oklab,var(--lume-bg)_18%,transparent)] text-2xs font-sans font-medium opacity-80">
                {shortcut}
              </kbd>
            )}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
