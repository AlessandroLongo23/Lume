'use client';

import { useCalendarStore } from '@/lib/stores/calendar';
import { formatDateString } from '@/lib/utils/date';
import { capitalize } from '@/lib/utils/string';

function formatHoveredTime(minutes: number): string {
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Big live preview of the cell currently under the cursor. */
export function HoveredTimePreview() {
  const hovered = useCalendarStore((s) => s.hoveredTime);
  const currentView = useCalendarStore((s) => s.currentView);

  if (currentView === 'month') return <div aria-hidden />;

  const dateLabel = hovered ? capitalize(formatDateString(hovered.date, 'EEE d MMM')) : null;
  const timeLabel = hovered ? formatHoveredTime(hovered.minutes) : null;

  return (
    <div
      aria-live="polite"
      className={`flex items-baseline gap-2 transition-opacity ${
        hovered ? 'opacity-100' : 'opacity-30'
      }`}
    >
      <span className="text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {dateLabel ?? ' '}
      </span>
      <span className="text-3xl font-semibold tabular-nums leading-none text-zinc-800 dark:text-zinc-100">
        {timeLabel ?? '--:--'}
      </span>
    </div>
  );
}
