'use client';

import { generateTimeSlots, formatTimeSlot } from '@/lib/utils/calendar-config';

export interface TimeGridColumn {
  key: string;
  label: string;
}

interface TimeGridProps {
  columns: TimeGridColumn[];
  date: Date;
  renderSlot: (columnKey: string, timeSlot: Date) => React.ReactNode;
  startHour?: number;
  endHour?: number;
}

export function TimeGrid({ columns, date, renderSlot, startHour, endHour }: TimeGridProps) {
  const bounds = startHour !== undefined && endHour !== undefined ? { startHour, endHour } : undefined;
  const timeSlots = generateTimeSlots(new Date(date), bounds);

  return (
    <div className="flex flex-col border border-zinc-500/25 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        {/* Header */}
        <div
          className="grid bg-zinc-100 dark:bg-zinc-800"
          style={{ gridTemplateColumns: `80px repeat(${columns.length}, minmax(120px, 1fr))` }}
        >
          <div className="p-2 font-medium border-r border-zinc-500/25 text-center text-sm">
            Orario
          </div>
          {columns.map((col) => (
            <div
              key={col.key}
              className="p-2 font-medium text-center border-r border-zinc-500/25 last:border-r-0 text-sm truncate"
            >
              {col.label}
            </div>
          ))}
        </div>

        {/* Time rows */}
        {timeSlots.map((timeSlot, i) => {
          const isHourMark = timeSlot.getMinutes() === 0;
          return (
            <div
              key={i}
              className="grid"
              style={{ gridTemplateColumns: `80px repeat(${columns.length}, minmax(120px, 1fr))` }}
            >
              {/* Time gutter */}
              <div
                className={`p-2 h-8 text-xs border-r border-zinc-500/25 flex items-center justify-center border-t ${
                  isHourMark ? 'border-zinc-500/50' : 'border-zinc-500/25'
                }`}
              >
                {formatTimeSlot(timeSlot)}
              </div>

              {/* Slot cells */}
              {columns.map((col) => (
                <div key={col.key} className="border-r border-zinc-500/25 last:border-r-0">
                  {renderSlot(col.key, timeSlot)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
