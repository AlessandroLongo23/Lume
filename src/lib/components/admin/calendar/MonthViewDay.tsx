'use client';

import { isToday, format, isPast, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';

interface MonthViewDayProps {
  day: Date;
  isCurrentMonth?: boolean;
  selectedDate: Date;
  totalMinutes: number;
  totalEarnings: number;
  onClick: (day: Date) => void;
}

// Scale: 0 min = no color, 480 min (8 h full day) = max intensity
const MAX_MINUTES = 480;
const MAX_OPACITY = 0.28;

function getHeatmapOpacity(totalMinutes: number): number {
  if (totalMinutes <= 0) return 0;
  return Math.min(totalMinutes / MAX_MINUTES, 1) * MAX_OPACITY;
}

function formatEarnings(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function MonthViewDay({ day, isCurrentMonth = true, selectedDate, totalMinutes, totalEarnings, onClick }: MonthViewDayProps) {
  const isDayToday = isToday(day);
  const isSelected = isSameDay(day, selectedDate);
  const isDayPast = isPast(day) && !isDayToday;
  const opacity = isCurrentMonth ? getHeatmapOpacity(totalMinutes) : 0;

  let textClasses = '';
  if (!isCurrentMonth) {
    textClasses = 'text-zinc-300 dark:text-zinc-600';
  } else if (isDayPast) {
    textClasses = 'text-zinc-400 dark:text-zinc-500';
  } else if (isSelected) {
    textClasses = 'text-indigo-700 font-semibold dark:text-indigo-300';
  } else {
    textClasses = 'text-zinc-900 dark:text-zinc-100';
  }

  return (
    <div
      className={`flex flex-col items-center relative w-full h-28 bg-white dark:bg-zinc-900 border-r border-b border-zinc-500/25 ${!isCurrentMonth ? 'opacity-40' : ''}`}
      role="button"
      tabIndex={0}
    >
      {/* Heatmap overlay — sits behind content, smoothly interpolates to indigo */}
      {opacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: `rgba(99, 102, 241, ${opacity})` }}
        />
      )}

      <button
        className={`w-full h-full flex flex-col items-start justify-start p-2 relative ${textClasses}`}
        onClick={() => isCurrentMonth && onClick(day)}
        aria-label={`Seleziona ${format(day, 'PPP', { locale: it })}`}
        type="button"
      >
        <span
          className={`text-sm font-medium ${
            isDayToday
              ? 'text-white bg-indigo-500 rounded-full w-7 h-7 flex items-center justify-center'
              : isSelected
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 rounded-full w-7 h-7 flex items-center justify-center'
                : ''
          }`}
        >
          {format(day, 'd', { locale: it })}
        </span>

        {/* Daily earnings total — bottom-right corner */}
        {isCurrentMonth && totalEarnings > 0 && (
          <span className="absolute bottom-1.5 right-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 tabular-nums">
            {formatEarnings(totalEarnings)}
          </span>
        )}
      </button>
    </div>
  );
}
