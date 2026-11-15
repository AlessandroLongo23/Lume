'use client';

import { useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { FloatingPanel } from '@/lib/components/shared/ui/FloatingPanel';
import { useAnchoredPopover } from '@/lib/hooks/useAnchoredPopover';
import { ColorSwatchPicker } from '@/lib/components/shared/ui/forms/ColorSwatchPicker';
import { colorForClient } from '@/lib/utils/clientColor';

interface ClientColorDotProps {
  clientId: string;
  /** Current explicit color override (null = auto). */
  color: string | null;
  /** Called when the user picks a swatch or resets to auto. */
  onChange: (color: string | null) => void | Promise<void>;
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
}: ClientColorDotProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const { open, toggle, hide, position, panelRef, side } = useAnchoredPopover(triggerRef, { panelMaxHeight: 200, offset: 6 });

  const displayed = colorForClient({ id: clientId, color });

  return (
    <>
      <button
        // ds-ignore: a 12px colour swatch that opens the colour picker, sitting inside the fiche block header; Button's smallest size is 32px and would change the look
        ref={triggerRef}
        type="button"
        aria-label="Cambia colore cliente"
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerDown={(e) => {
          // Calendar fiche-block header uses pointerdown to start a drag —
          // stop it here so the dot click never turns into a move.
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        className="size-3 shrink-0 rounded-full shadow-[inset_0_0_0_1px_var(--lume-edge)] hover:shadow-[inset_0_0_0_2px_var(--lume-edge-hover)] transition-[box-shadow] cursor-pointer"
        style={{ backgroundColor: displayed }}
      />
      <Portal>
        <AnimatePresence>
          {open && position && (
            <FloatingPanel
              ref={panelRef}
              side={side}
              layer="dropdown"
              role="dialog"
              aria-label="Colore cliente"
              className="p-3"
              style={{ position: 'fixed', left: position.left, top: position.top, bottom: position.bottom }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <ColorSwatchPicker
                value={color}
                onChange={(next) => {
                  void onChange(next);
                  hide();
                }}
                allowAuto
                ariaLabel="Colore cliente"
                hint="Puoi cambiare il colore in qualsiasi momento."
              />
            </FloatingPanel>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
