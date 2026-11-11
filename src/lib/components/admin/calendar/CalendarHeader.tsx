'use client';

import { useCalendarStore } from '@/lib/stores/calendar';
import { formatDateString } from '@/lib/utils/date';
import { capitalize } from '@/lib/utils/string';

function formatHoveredTime(minutes: number): string {
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Quiet live readout of the cell under the cursor: weekday, date and time in mono. */
export function HoveredTimePreview() {
  const hovered = useCalendarStore((s) => s.hoveredTime);
  const currentView = useCalendarStore((s) => s.currentView);

  if (currentView === 'month') return <div aria-hidden />;

  const dateLabel = hovered ? capitalize(formatDateString(hovered.date, 'EEE d MMM')) : null;
  const timeLabel = hovered ? formatHoveredTime(hovered.minutes) : null;

  return (
    <div
      aria-live="polite"
      className={`flex items-baseline gap-1.5 text-compact leading-none whitespace-nowrap transition-opacity motion-reduce:transition-none ${
        hovered ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <span className="text-[var(--lume-text-muted)]">{dateLabel ?? ' '}</span>
      <span className="tabular-nums text-[var(--lume-text-secondary)]">
        {timeLabel ?? '--:--'}
      </span>
    </div>
  );
}
