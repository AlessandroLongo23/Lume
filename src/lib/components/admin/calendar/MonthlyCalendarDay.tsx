'use client';

import { useState } from 'react';
import { isToday, format, isPast, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { useFichesStore } from '@/lib/stores/fiches';

interface MonthlyCalendarDayProps {
  day: Date;
  isCurrentMonth?: boolean;
  selectedDate: Date;
  onClick: (day: Date) => void;
}

export function MonthlyCalendarDay({ day, isCurrentMonth = true, selectedDate, onClick }: MonthlyCalendarDayProps) {
  const [isHovered, setIsHovered] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  const fiches = useFichesStore((s) => s.fiches);

  const hasFiches = fiches.some((f) => isSameDay(new Date(f.datetime), day));
  const ficheCount = fiches.filter((f) => isSameDay(new Date(f.datetime), day)).length;

  const isDayToday = isToday(day);
  const isSelected = isSameDay(day, selectedDate);
  const isDayPast = isPast(day) && !isToday(day);

  let dayClasses = '';
  if (!isCurrentMonth) {
    dayClasses = 'text-zinc-300 dark:text-zinc-600';
  } else if (isDayPast) {
    dayClasses = 'text-zinc-400 dark:text-zinc-500';
  } else if (isSelected) {
    dayClasses = 'bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900 dark:text-blue-100';
  } else {
    dayClasses = 'text-zinc-900 dark:text-zinc-100';
  }

  return (
    <div
      className={`flex flex-col items-center relative w-full h-28 bg-white dark:bg-zinc-900 border-r border-b border-zinc-500/25 ${!isCurrentMonth ? 'opacity-40' : ''}`}
      onMouseEnter={() => setIsHovered(isCurrentMonth)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
    >
      <button
        className={`w-full h-full flex flex-col items-start justify-start p-2 relative ${dayClasses}`}
        onClick={() => isCurrentMonth && onClick(day)}
        aria-label={`Seleziona ${format(day, 'PPP', { locale: it })}`}
        type="button"
      >
        <span className={`text-sm font-medium ${isDayToday ? 'text-white bg-[#89684c] rounded-full w-7 h-7 flex items-center justify-center' : ''}`}>
          {format(day, 'd', { locale: it })}
        </span>
        {hasFiches && (
          <div className="mt-1 flex gap-0.5">
            {Array.from({ length: Math.min(ficheCount, 3) }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500" />
            ))}
          </div>
        )}
      </button>
    </div>
  );
}
