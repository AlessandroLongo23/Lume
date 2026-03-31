'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Activity {
  date: Date | string;
  intensity?: number;
  type?: string;
  count?: number;
}

interface CalendarActivityProps {
  activities?: Activity[];
  months?: number;
}

function getActivityClass(day: { activity: Activity | null } | null): string {
  if (!day || !day.activity) return 'bg-zinc-100 dark:bg-zinc-700';
  const intensity = day.activity.intensity ?? 0;
  const level = Math.min(4, Math.max(0, intensity));
  const classes = [
    'bg-zinc-100 dark:bg-zinc-700',
    'bg-blue-200 dark:bg-blue-900',
    'bg-blue-400 dark:bg-blue-600',
    'bg-blue-600 dark:bg-blue-500',
    'bg-blue-800 dark:bg-blue-400',
  ];
  return classes[level];
}

function formatDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('it-IT', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });
}

function getActivityDescription(day: { activity: Activity | null } | null): string {
  if (!day || !day.activity) return 'Nessuna attività';
  const { type, count } = day.activity;
  const descriptions: Record<string, string> = {
    login: `Accesso ${count} ${count === 1 ? 'volta' : 'volte'}`,
    client: `${count} ${count === 1 ? 'cliente' : 'clienti'}`,
    exercise: `${count} ${count === 1 ? 'esercizio' : 'esercizi'} completati`,
    topic: `${count} ${count === 1 ? 'argomento' : 'argomenti'} studiati`,
  };
  return type ? (descriptions[type] ?? `${count} attività`) : `${count} attività`;
}

export function CalendarActivity({ activities = [], months = 3 }: CalendarActivityProps) {
  const [endDate, setEndDate] = useState(new Date());

  const startDate = useMemo(() => {
    const d = new Date(endDate);
    d.setMonth(d.getMonth() - months);
    return d;
  }, [endDate, months]);

  const days = useMemo(() => {
    const result: { date: Date; activity: Activity | null }[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const curr0 = new Date(current).setHours(0, 0, 0, 0);
      result.push({
        date: new Date(current),
        activity: activities.find((a) => new Date(a.date).setHours(0, 0, 0, 0) === curr0) ?? null,
      });
      current.setDate(current.getDate() + 1);
    }
    return result;
  }, [startDate, endDate, activities]);

  const weeks = useMemo(() => {
    const result: (typeof days[0] | null)[][] = [];
    let week: (typeof days[0] | null)[] = [];
    const firstDay = days[0]?.date.getDay() ?? 0;
    for (let i = 0; i < firstDay; i++) week.push(null);
    for (const day of days) {
      week.push(day);
      if (week.length === 7) { result.push(week); week = []; }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      result.push(week);
    }
    return result;
  }, [days]);

  const today = new Date();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Activity Calendar</div>
        <div className="flex items-center gap-2">
          <button
            className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
            onClick={() => {
              const d = new Date(endDate);
              d.setMonth(d.getMonth() - months);
              setEndDate(d);
            }}
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            {startDate.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' })} -{' '}
            {endDate.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' })}
          </div>
          <button
            className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 disabled:opacity-40"
            disabled={endDate >= today}
            onClick={() => {
              const d = new Date(endDate);
              d.setMonth(d.getMonth() + months);
              setEndDate(d > today ? today : d);
            }}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-7 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
          {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map((d) => (
            <div key={d} className="text-center">{d}</div>
          ))}
        </div>

        <div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
              {week.map((day, di) =>
                day ? (
                  <div
                    key={di}
                    className={`aspect-square rounded-sm relative min-w-3 min-h-3 hover:opacity-80 cursor-pointer ${getActivityClass(day)}`}
                    title={`${formatDate(day.date)}: ${getActivityDescription(day)}`}
                  >
                    {day.date.getDate() === 1 && (
                      <div className="text-[8px] font-thin text-zinc-700 dark:text-zinc-300 leading-tight pl-0.5">
                        {day.date.toLocaleDateString('it-IT', { month: 'short' })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div key={di} className="aspect-square" />
                )
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 mt-3 justify-end">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Less</span>
        {['bg-zinc-100 dark:bg-zinc-700', 'bg-blue-200 dark:bg-blue-900', 'bg-blue-400 dark:bg-blue-600', 'bg-blue-600 dark:bg-blue-500', 'bg-blue-800 dark:bg-blue-400'].map((cls, i) => (
          <div key={i} className={`size-3 rounded-sm ${cls}`} />
        ))}
        <span className="text-xs text-zinc-500 dark:text-zinc-400">More</span>
      </div>
    </div>
  );
}
