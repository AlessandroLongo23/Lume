'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useCalendarDragStore } from '@/lib/stores/calendarDrag';
import { useOperatorsStore } from '@/lib/stores/operators';
import { isWarningReason } from '@/lib/utils/calendar-conflicts';
import { Portal } from '@/lib/components/shared/ui/Portal';

interface CalendarDragGhostProps {
  /** Pixels per slot row (32 today). */
  pixelsPerSlot: number;
  /** Minutes represented by one slot row. */
  timeStep: number;
}

/**
 * Floating preview rendered while the user is dragging or resizing a fiche.
 * Reads the preview from the calendarDrag store and locates the right slot
 * cell in the DOM to position itself, so it works for both DayView (operator
 * columns) and WeekView (day columns).
 */
export function CalendarDragGhost({ pixelsPerSlot, timeStep }: CalendarDragGhostProps) {
  const active = useCalendarDragStore((s) => s.active);
  const preview = useCalendarDragStore((s) => s.preview);
  const conflict = useCalendarDragStore((s) => s.conflict);
  const operators = useOperatorsStore((s) => s.operators);

  // Force re-render on scroll/resize so the ghost stays glued to the slot.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const onChange = () => setTick((t) => t + 1);
    window.addEventListener('scroll', onChange, true);
    window.addEventListener('resize', onChange);
    let raf = 0;
    const loop = () => { onChange(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('scroll', onChange, true);
      window.removeEventListener('resize', onChange);
      cancelAnimationFrame(raf);
    };
  }, [active]);

  if (!active || preview.length === 0) return null;

  const first = preview[0];
  const last = preview[preview.length - 1];

  // Snap start to nearest slot boundary to find the anchor slot in the DOM.
  const startMs = first.start.getTime();
  const slotMs = timeStep * 60_000;
  const snappedStart = new Date(Math.floor(startMs / slotMs) * slotMs);
  const minutesIntoSlot = (startMs - snappedStart.getTime()) / 60_000;

  // Locate any slot belonging to this operator on the same day, then walk to the precise time.
  const operatorId = first.operatorId;
  // Match slots whose data-cal-time falls on the same date AND same operator
  const candidates = Array.from(
    document.querySelectorAll(`[data-cal-slot][data-cal-operator="${operatorId}"]`),
  ) as HTMLElement[];
  const dayCandidates = candidates.filter((el) => {
    const t = el.getAttribute('data-cal-time');
    if (!t) return false;
    return new Date(t).toISOString().slice(0, 10) === new Date(snappedStart).toISOString().slice(0, 10);
  });

  // Fallback: if a precise match exists, use it directly
  const exact = dayCandidates.find((el) => {
    const t = el.getAttribute('data-cal-time');
    return t && Math.abs(new Date(t).getTime() - snappedStart.getTime()) < 1000;
  });

  let rect: DOMRect | null = null;
  if (exact) rect = exact.getBoundingClientRect();
  else if (dayCandidates.length > 0) {
    // Choose the slot closest in time and offset Y from there.
    const closest = dayCandidates.reduce((best, el) => {
      const t = new Date(el.getAttribute('data-cal-time') ?? 0).getTime();
      const bestT = new Date(best.getAttribute('data-cal-time') ?? 0).getTime();
      return Math.abs(t - snappedStart.getTime()) < Math.abs(bestT - snappedStart.getTime()) ? el : best;
    });
    const closestRect = closest.getBoundingClientRect();
    const closestT = new Date(closest.getAttribute('data-cal-time') ?? 0).getTime();
    const slotsOff = (snappedStart.getTime() - closestT) / slotMs;
    rect = new DOMRect(
      closestRect.left,
      closestRect.top + slotsOff * pixelsPerSlot,
      closestRect.width,
      closestRect.height,
    );
  }

  if (!rect) return null;

  const totalMinutes = (last.end.getTime() - first.start.getTime()) / 60_000;
  const topPx = rect.top + (minutesIntoSlot / timeStep) * pixelsPerSlot;
  const heightPx = (totalMinutes / timeStep) * pixelsPerSlot;
  const operatorName = operators.find((op) => op.id === first.operatorId)?.getFullName() ?? '';
  const reasonLabel = conflict.reason
    ? conflict.reason === 'overlap'
      ? 'Sovrapposizione operatore'
      : conflict.reason === 'client-overlap'
        ? 'Cliente già impegnato'
        : conflict.reason === 'outside-hours'
          ? 'Fuori orari di apertura'
          : conflict.reason === 'closed-day'
            ? 'Giorno di chiusura'
            : conflict.reason === 'past'
              ? 'Orario nel passato'
              : 'Intervallo non valido'
    : null;

  const warning = isWarningReason(conflict.reason);
  const accent = !conflict.valid ? '#ef4444' : warning ? '#f59e0b' : '#6366F1';
  const bg = !conflict.valid
    ? 'rgba(239, 68, 68, 0.18)'
    : warning
      ? 'rgba(245, 158, 11, 0.18)'
      : 'rgba(99, 102, 241, 0.18)';

  // Use tick to keep the linter happy / force the recompute.
  void tick;

  return (
    <Portal>
      <div
        className="fixed z-drag pointer-events-none rounded-md shadow-lg"
        style={{
          left: rect.left + 2,
          top: topPx,
          width: rect.width - 4,
          height: heightPx,
          background: bg,
          border: `2px solid ${accent}`,
        }}
      >
        <div
          className="absolute -top-7 left-0 px-2 py-1 rounded text-[11px] font-semibold whitespace-nowrap shadow"
          style={{
            background: accent,
            color: 'white',
          }}
        >
          {format(first.start, 'HH:mm')}–{format(last.end, 'HH:mm')}
          {operatorName && <> · {operatorName}</>}
          {reasonLabel && <> · {reasonLabel}</>}
        </div>
      </div>
    </Portal>
  );
}
