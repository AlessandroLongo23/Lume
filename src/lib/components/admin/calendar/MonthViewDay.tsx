'use client';

import { isToday, format, isPast, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';

interface MonthViewDayProps {
  day: Date;
  isCurrentMonth?: boolean;
  selectedDate: Date;
  totalMinutes: number;
  totalEarnings: number;
  /** Null when no operator is selected (view shows salon-wide totals) */
  operatorMinutes: number | null;
  operatorEarnings: number | null;
  onClick: (day: Date) => void;
}

// Load bar: 0 min = empty, 480 min (8 h full day) = full width.
const MAX_MINUTES = 480;

function getLoadRatio(totalMinutes: number): number {
  if (totalMinutes <= 0) return 0;
  return Math.min(totalMinutes / MAX_MINUTES, 1);
}

function formatEarnings(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function MonthViewDay({ day, isCurrentMonth = true, selectedDate, totalMinutes, totalEarnings, operatorMinutes, operatorEarnings, onClick }: MonthViewDayProps) {
  const isDayToday = isToday(day);
  const isSelected = isSameDay(day, selectedDate);
  const isDayPast = isPast(day) && !isDayToday;
  const hasOperatorFilter = operatorMinutes !== null && operatorEarnings !== null;
  // Heatmap and primary earnings reflect the selected operator when one is chosen
  const heatmapMinutes = hasOperatorFilter ? operatorMinutes : totalMinutes;
  const primaryEarnings = hasOperatorFilter ? operatorEarnings : totalEarnings;
  const load = isCurrentMonth ? getLoadRatio(heatmapMinutes) : 0;

  let textClasses = '';
  if (!isCurrentMonth) {
    textClasses = 'text-[var(--lume-text-muted)]';
  } else if (isDayPast) {
    textClasses = 'text-[var(--lume-text-muted)]';
  } else {
    textClasses = 'text-[var(--lume-text)]';
  }

  return (
    <div
      className={`flex flex-col items-center relative w-full h-28 border-t border-l border-line [&:nth-child(7n+1)]:border-l-0 ${!isCurrentMonth ? 'opacity-40' : ''}`}
    >
      <button
        // ds-ignore: month grid day cell, a full-cell hit area with its own layout; Button is a fixed-height control and the fill marks the hovered day, not a list row
        className={`w-full h-full flex flex-col items-start justify-start p-2 relative transition-colors hover:bg-hover focus:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--lume-ring-focus)] ${textClasses}`}
        onClick={() => isCurrentMonth && onClick(day)}
        aria-label={`Seleziona ${format(day, 'PPP', { locale: it })}`}
        aria-current={isDayToday ? 'date' : undefined}
        type="button"
      >
        <span
          className={`tabular-nums text-compact leading-none min-w-6 h-6 px-1 rounded-full inline-flex items-center justify-center -ml-1 ${
            isSelected ? 'selected' : isDayToday ? 'marker-current' : ''
          }`}
        >
          {format(day, 'd', { locale: it })}
        </span>

        {/* Daily earnings — operator-specific when a filter is active, with salon-wide total alongside for context */}
        {isCurrentMonth && (primaryEarnings > 0 || (hasOperatorFilter && totalEarnings > 0)) && (
          <span className="absolute bottom-3.5 left-2 right-2 tabular-nums text-2xs sm:text-xs flex items-baseline gap-1 truncate">
            <span className="text-[var(--lume-text)]">
              {formatEarnings(primaryEarnings)}
            </span>
            {hasOperatorFilter && totalEarnings > 0 && totalEarnings !== primaryEarnings && (
              <span className="hidden sm:inline text-2xs text-[var(--lume-text-muted)]">
                / {formatEarnings(totalEarnings)}
              </span>
            )}
          </span>
        )}

        {/* Booked time as a thin bar: full width = an 8-hour day. */}
        {load > 0 && (
          <span aria-hidden className="absolute bottom-2 left-2 right-2 h-0.5 rounded-full bg-line overflow-hidden">
            <span
              className="block h-full rounded-full bg-[var(--lume-text-secondary)]"
              style={{ width: `${Math.round(load * 100)}%` }}
            />
          </span>
        )}
      </button>
    </div>
  );
}
