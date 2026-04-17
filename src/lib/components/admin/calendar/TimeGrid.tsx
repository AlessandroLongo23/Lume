'use client';

import { useState, useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { generateTimeSlots, formatTimeSlot, CALENDAR_CONFIG } from '@/lib/utils/calendar-config';

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
  /** Original schedule bounds — slots outside this range are marked as extended hours. */
  scheduleBounds?: { startHour: number; endHour: number };
}

export function TimeGrid({ columns, date, renderSlot, startHour, endHour, scheduleBounds }: TimeGridProps) {
  const effectiveStartHour = startHour ?? CALENDAR_CONFIG.daily.startHour;
  const effectiveEndHour = endHour ?? CALENDAR_CONFIG.daily.endHour;
  const bounds = startHour !== undefined && endHour !== undefined ? { startHour, endHour } : undefined;
  const timeSlots = generateTimeSlots(new Date(date), bounds);

  // Now line — updates every 60 seconds
  const [nowMinutes, setNowMinutes] = useState<number>(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setNowMinutes(n.getHours() * 60 + n.getMinutes());
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const gridStartMinutes = effectiveStartHour * 60;
  const gridEndMinutes = effectiveEndHour * 60;
  // Each slot is h-8 = 2rem, spanning 15 minutes
  const nowTopRem = ((nowMinutes - gridStartMinutes) / 15) * 2;
  const showNowLine = isToday && nowMinutes >= gridStartMinutes && nowMinutes <= gridEndMinutes;

  // Auto-scroll to center the Now Line on mount (today only)
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showNowLine || !scrollRef.current) return;
    const container = scrollRef.current;
    const nowTopPx = nowTopRem * 16; // rem → px (assumes 16px root)
    const center = nowTopPx - container.clientHeight / 2;
    container.scrollTop = Math.max(0, center);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  const gridCols = { gridTemplateColumns: `80px repeat(${columns.length}, minmax(120px, 1fr))` };

  return (
    <div className="border border-zinc-500/25 rounded-lg overflow-hidden">
      <div ref={scrollRef} className="overflow-auto max-h-[calc(100vh-14rem)]">
        {/* Header — sticky so operator names stay visible while scrolling */}
        <div
          className="grid sticky top-0 z-20 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-500/25"
          style={gridCols}
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
        <div className="relative">
          {showNowLine && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
              style={{ top: `${nowTopRem}rem` }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <div className="flex-1 border-t-2 border-red-500 border-dashed" />
            </div>
          )}
          {timeSlots.map((timeSlot, i) => {
            const isHourMark = timeSlot.getMinutes() === 0;
            const slotHour = timeSlot.getHours();
            const isExtended =
              !!scheduleBounds &&
              (slotHour < scheduleBounds.startHour || slotHour >= scheduleBounds.endHour);
            return (
              <div
                key={i}
                className="grid"
                style={gridCols}
              >
                {/* Time gutter */}
                <div
                  className={`p-2 h-8 text-xs border-r border-zinc-500/25 flex items-center justify-center gap-1 border-t ${
                    isHourMark ? 'border-zinc-500/50' : 'border-zinc-500/25'
                  } ${
                    isExtended ? 'bg-amber-500/8 text-amber-700 dark:text-amber-400' : ''
                  }`}
                  title={isExtended ? 'Fuori orari di apertura' : undefined}
                >
                  {isExtended && <AlertTriangle className="size-3 shrink-0" />}
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
    </div>
  );
}
