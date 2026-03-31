'use client';

import { useMemo } from 'react';
import { getMonthDays, weekDays } from '@/lib/utils/date';
import { MonthlyCalendarDay } from './MonthlyCalendarDay';

interface MonthlyCalendarProps {
  currentMonth: Date;
  selectedDate: Date;
  onDayClick: (day: Date) => void;
}

export function MonthlyCalendar({ currentMonth, selectedDate, onDayClick }: MonthlyCalendarProps) {
  const monthDays = useMemo(() => getMonthDays(currentMonth), [currentMonth]);

  return (
    <>
      <div className="grid grid-cols-7">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 py-2 uppercase tracking-wider border-b border-zinc-500/25">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0 border border-zinc-500/25 rounded-lg overflow-hidden">
        {monthDays.map((day, i) => (
          <MonthlyCalendarDay
            key={i}
            day={day.date}
            isCurrentMonth={day.isCurrentMonth}
            selectedDate={selectedDate}
            onClick={onDayClick}
          />
        ))}
      </div>
    </>
  );
}
