'use client';

import { useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Button } from '@/lib/components/shared/ui/Button';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { FloatingPanel } from '@/lib/components/shared/ui/FloatingPanel';
import { CalendarPanel } from '@/lib/components/shared/ui/forms/CalendarPanel';
import { useAnchoredPopover } from '@/lib/hooks/useAnchoredPopover';

interface CalendarDatePickerProps {
  /** The label rendered on the trigger. */
  label: string;
  /** Optional shorter label shown on phone widths instead of `label`. */
  shortLabel?: string;
  /** Date to highlight (for day/week views). */
  selectedDate: Date;
  /** Month to display when opening. */
  currentMonth: Date;
  /** Called with the picked date; parent decides how to apply it per view. */
  onSelect: (date: Date) => void;
  /** Called when the user clicks "Torna a oggi". */
  onGoToToday: () => void;
  /** When true, the grid picks whole months. */
  monthOnly?: boolean;
}

const PICKER_WIDTH = 288;

/** The calendar toolbar's date title, opening the shared <CalendarPanel>. */
export function CalendarDatePicker({
  label,
  shortLabel,
  selectedDate,
  currentMonth,
  onSelect,
  onGoToToday,
  monthOnly = false,
}: CalendarDatePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { open, show, hide, position, panelRef, side } = useAnchoredPopover(triggerRef, {
    panelMaxHeight: 380,
    offset: 6,
  });
  // Remount the panel on every open, so it starts on the current month and view.
  const [openCount, setOpenCount] = useState(0);

  const toggle = () => {
    if (open) return hide();
    setOpenCount((n) => n + 1);
    show();
  };

  return (
    <>
      {/* The toolbar's date title: a ghost button at title size, pressed while the picker is open. */}
      <Button
        ref={triggerRef}
        variant="ghost"
        pressed={open}
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="px-2 -mx-0.5 shrink min-w-0 justify-start overflow-hidden text-base sm:text-lg tracking-tight text-[var(--lume-text)] select-none"
      >
        {shortLabel ? (
          <>
            <span className="truncate sm:hidden">{shortLabel}</span>
            <span className="hidden sm:block truncate">{label}</span>
          </>
        ) : (
          <span className="truncate">{label}</span>
        )}
      </Button>

      <Portal>
        <AnimatePresence>
          {open && position && (
            <FloatingPanel
              ref={panelRef}
              side={side}
              role="dialog"
              aria-label="Seleziona data"
              style={{
                position: 'fixed',
                top: position.top,
                bottom: position.bottom,
                left: Math.max(8, Math.min(position.left + position.width / 2 - PICKER_WIDTH / 2, window.innerWidth - PICKER_WIDTH - 8)),
                width: PICKER_WIDTH,
              }}
              className="p-3"
            >
              <CalendarPanel
                key={openCount}
                selected={selectedDate}
                initialMonth={currentMonth}
                monthOnly={monthOnly}
                onPickDay={(d) => { onSelect(d); hide(); }}
                onPickMonth={(d) => { onSelect(d); hide(); }}
                footer={
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => { onGoToToday(); hide(); }}>
                    Torna a oggi
                  </Button>
                }
              />
            </FloatingPanel>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
