'use client';

import { useMemo } from 'react';
import { isSameDay } from 'date-fns';
import { getMonthDays, weekDays } from '@/lib/utils/date';
import { useFichesStore } from '@/lib/stores/fiches';
import { useFicheServicesStore } from '@/lib/stores/fiche_services';
import { useServicesStore } from '@/lib/stores/services';
import { MonthViewDay } from './MonthViewDay';

interface MonthViewProps {
  currentMonth: Date;
  selectedDate: Date;
  onDayClick: (day: Date) => void;
}

interface DayMetrics {
  totalMinutes: number;
  totalEarnings: number;
}

export function MonthView({ currentMonth, selectedDate, onDayClick }: MonthViewProps) {
  const fiches = useFichesStore((s) => s.fiches);
  const ficheServices = useFicheServicesStore((s) => s.fiche_services);
  const services = useServicesStore((s) => s.services);
  const monthDays = useMemo(() => getMonthDays(currentMonth), [currentMonth]);

  // Pre-compute metrics per day in a single pass
  const dayMetrics = useMemo(() => {
    const metrics = new Map<string, DayMetrics>();

    // Index fiche_services by fiche_id for O(1) lookup
    const fsByFicheId = new Map<string, typeof ficheServices>();
    for (const fs of ficheServices) {
      const list = fsByFicheId.get(fs.fiche_id) ?? [];
      list.push(fs);
      fsByFicheId.set(fs.fiche_id, list);
    }

    // Index service price by service_id
    const priceById = new Map<string, number>();
    for (const s of services) {
      priceById.set(s.id, s.price);
    }

    for (const { date } of monthDays) {
      const key = date.toDateString();
      if (metrics.has(key)) continue;

      const dayFiches = fiches.filter((f) => isSameDay(new Date(f.datetime), date));
      let totalMinutes = 0;
      let totalEarnings = 0;

      for (const fiche of dayFiches) {
        for (const fs of fsByFicheId.get(fiche.id) ?? []) {
          totalMinutes += fs.duration;
          totalEarnings += priceById.get(fs.service_id) ?? 0;
        }
      }

      metrics.set(key, { totalMinutes, totalEarnings });
    }

    return metrics;
  }, [fiches, ficheServices, services, monthDays]);

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
        {monthDays.map((day, i) => {
          const metrics = dayMetrics.get(day.date.toDateString()) ?? { totalMinutes: 0, totalEarnings: 0 };
          return (
            <MonthViewDay
              key={i}
              day={day.date}
              isCurrentMonth={day.isCurrentMonth}
              selectedDate={selectedDate}
              totalMinutes={metrics.totalMinutes}
              totalEarnings={metrics.totalEarnings}
              onClick={onDayClick}
            />
          );
        })}
      </div>
    </>
  );
}
