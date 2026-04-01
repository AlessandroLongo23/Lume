'use client';

import { isToday, format, isPast, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';

interface MonthViewDayProps {
  day: Date;
  isCurrentMonth?: boolean;
  selectedDate: Date;
  ficheCount: number;
  onClick: (day: Date) => void;
}

function getHeatmapClass(count: number): string {
  if (count === 0) return '';
  if (count <= 2) return 'bg-indigo-500/5 dark:bg-indigo-400/10';
  if (count <= 5) return 'bg-indigo-500/10 dark:bg-indigo-400/20';
  return 'bg-indigo-500/20 dark:bg-indigo-400/30';
}

export function MonthViewDay({ day, isCurrentMonth = true, selectedDate, ficheCount, onClick }: MonthViewDayProps) {
  const isDayToday = isToday(day);
  const isSelected = isSameDay(day, selectedDate);
  const isDayPast = isPast(day) && !isDayToday;

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

  const heatmap = isCurrentMonth ? getHeatmapClass(ficheCount) : '';

  return (
    <div
      className={`flex flex-col items-center relative w-full h-28 bg-white dark:bg-zinc-900 border-r border-b border-zinc-500/25 ${!isCurrentMonth ? 'opacity-40' : ''} ${heatmap}`}
      role="button"
      tabIndex={0}
    >
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
      </button>
    </div>
  );
}
