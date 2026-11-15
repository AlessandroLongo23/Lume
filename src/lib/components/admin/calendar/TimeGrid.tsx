'use client';

import { useState, useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { generateTimeSlots, formatTimeSlot, CALENDAR_CONFIG } from '@/lib/utils/calendar-config';
import { useSalonSettingsStore } from '@/lib/stores/salonSettings';
import { remToPx } from '@/lib/utils/uiScale';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';

export interface TimeGridColumn {
  key: string;
  /** Plain-text label: used as the header text and as its accessible name. */
  label: string;
  /** Optional richer header content (avatar, weekday + date). Falls back to `label`. */
  header?: React.ReactNode;
}

interface TimeGridProps {
  columns: TimeGridColumn[];
  date: Date;
  renderSlot: (columnKey: string, timeSlot: Date) => React.ReactNode;
  startHour?: number;
  endHour?: number;
  /** Original schedule bounds — slots outside this range are marked as extended hours. */
  scheduleBounds?: { startHour: number; endHour: number };
  /** Fired when the cursor enters a cell. Consumers map columnKey → operator/date. */
  onCellHover?: (columnKey: string, timeSlot: Date) => void;
}

/** Width of the time gutter. Keep in sync with the `w-16` classes below. */
const GUTTER = '4rem';
const MIN_COLUMN = '6rem';

function formatMinutes(total: number): string {
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function TimeGrid({ columns, date, renderSlot, startHour, endHour, scheduleBounds, onCellHover }: TimeGridProps) {
  const timeStep =
    useSalonSettingsStore((s) => s.settings?.slot_granularity_min) ?? CALENDAR_CONFIG.daily.timeStep;
  const effectiveStartHour = startHour ?? CALENDAR_CONFIG.daily.startHour;
  const effectiveEndHour = endHour ?? CALENDAR_CONFIG.daily.endHour;
  const bounds = startHour !== undefined && endHour !== undefined ? { startHour, endHour } : undefined;
  const timeSlots = generateTimeSlots(new Date(date), bounds, timeStep);

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
  // Each slot row is h-8 = 2rem and spans `timeStep` minutes
  const nowTopRem = ((nowMinutes - gridStartMinutes) / timeStep) * 2;
  const showNowLine = isToday && nowMinutes >= gridStartMinutes && nowMinutes <= gridEndMinutes;

  // Auto-scroll to center the Now Line on mount (today only)
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showNowLine || !scrollRef.current) return;
    const container = scrollRef.current;
    const nowTopPx = remToPx(nowTopRem);
    const center = nowTopPx - container.clientHeight / 2;
    container.scrollTop = Math.max(0, center);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // Rows are as wide as the columns need, so on a phone the grid scrolls
  // sideways while the time gutter stays pinned on the left.
  const gridCols = {
    gridTemplateColumns: `${GUTTER} repeat(${columns.length}, minmax(${MIN_COLUMN}, 1fr))`,
    minWidth: `calc(${GUTTER} + ${columns.length} * ${MIN_COLUMN})`,
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto no-scrollbar">
        {/* Header — sticky so operator names stay visible while scrolling */}
        <div
          className="grid sticky top-0 z-sticky bg-[var(--lume-panel)] border-b border-line"
          style={gridCols}
        >
          <div className="sticky left-0 bg-[var(--lume-panel)]">
            <span className="sr-only">Orario</span>
          </div>
          {columns.map((col) => (
            <Tooltip key={col.key} label={col.label}>
              <div className="h-12 px-3 flex items-center min-w-0 text-sm font-medium text-[var(--lume-text)]">
                {col.header ?? <span className="truncate">{col.label}</span>}
              </div>
            </Tooltip>
          ))}
        </div>

        {/* Top breathing room so the first hour label is not clipped by the header. */}
        <div className="pt-2">
          {/* Time rows — `isolate` creates a stacking context so blocks and the
              now-line can layer relative to each other while staying below the
              sticky operator header above. */}
          <div className="relative isolate">
            {showNowLine && (
              <div
                className="absolute inset-x-0 h-0 z-content-floating pointer-events-none flex items-center"
                style={{ top: `${nowTopRem}rem` }}
                aria-hidden
              >
                <div className="sticky left-0 w-16 shrink-0 flex justify-end pr-1.5">
                  <span className="tabular-nums text-2xs font-medium leading-none px-1.5 py-1 rounded-full bg-[var(--lume-accent)] text-[var(--lume-text-on-accent)] select-none">
                    {formatMinutes(nowMinutes)}
                  </span>
                </div>
                <div className="relative flex-1 h-px bg-[var(--lume-accent)]">
                  <span className="absolute left-0 top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--lume-accent)]" />
                </div>
              </div>
            )}
            {timeSlots.map((timeSlot, i) => {
              const isHourMark = timeSlot.getMinutes() === 0;
              // The now chip sits in the gutter: hide an hour label it would collide with.
              const slotMinutes = timeSlot.getHours() * 60 + timeSlot.getMinutes();
              const hiddenByNow = showNowLine && Math.abs(slotMinutes - nowMinutes) < 12;
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
                  {/* Time gutter: labels on the hour only, sitting on the hour line. */}
                  <Tooltip label={isExtended ? 'Fuori orari di apertura' : undefined}>
                    <div className="sticky left-0 z-sticky h-8 bg-[var(--lume-panel)]">
                      {isHourMark && !hiddenByNow && (
                        <span
                          className={`absolute right-3 top-0 -translate-y-1/2 flex items-center gap-1 tabular-nums text-2xs leading-none ${
                            isExtended
                              ? 'text-warning-strong'
                              : 'text-[var(--lume-text-secondary)]'
                          }`}
                        >
                          {isExtended && <AlertTriangle className="size-3 shrink-0" aria-label="Fuori orari di apertura" />}
                          {formatTimeSlot(timeSlot)}
                        </span>
                      )}
                    </div>
                  </Tooltip>

                  {/* Slot cells */}
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      className="border-l border-line"
                      onPointerEnter={onCellHover ? () => onCellHover(col.key, timeSlot) : undefined}
                    >
                      {renderSlot(col.key, timeSlot)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
