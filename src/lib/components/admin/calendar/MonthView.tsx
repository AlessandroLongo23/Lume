'use client';

import { useMemo } from 'react';
import { isSameDay } from 'date-fns';
import { getMonthDays, weekDays } from '@/lib/utils/date';
import { useFichesStore } from '@/lib/stores/fiches';
import { MonthViewDay } from './MonthViewDay';

interface MonthViewProps {
  currentMonth: Date;
  selectedDate: Date;
  onDayClick: (day: Date) => void;
}

export function MonthView({ currentMonth, selectedDate, onDayClick }: MonthViewProps) {
  const fiches = useFichesStore((s) => s.fiches);
  const monthDays = useMemo(() => getMonthDays(currentMonth), [currentMonth]);

  // Pre-compute fiche counts per day in a single pass
  const ficheCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { date } of monthDays) {
      const key = date.toDateString();
      if (!counts.has(key)) {
        counts.set(key, fiches.filter((f) => isSameDay(new Date(f.datetime), date)).length);
      }
    }
    return counts;
  }, [fiches, monthDays]);

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
          <MonthViewDay
            key={i}
            day={day.date}
            isCurrentMonth={day.isCurrentMonth}
            selectedDate={selectedDate}
            ficheCount={ficheCounts.get(day.date.toDateString()) ?? 0}
            onClick={onDayClick}
          />
        ))}
      </div>
    </>
  );
}
