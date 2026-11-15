'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { isSameDay, setMonth, setYear, startOfMonth } from 'date-fns';
import { addMonths, subMonths, getMonthDays, formatDateString, weekDays } from '@/lib/utils/date';
import { capitalize } from '@/lib/utils/string';
import { useHoverGlide } from '@/lib/hooks/useHoverGlide';
import { cn } from '@/lib/utils';
import { Button } from '../Button';

type Mode = 'day' | 'month' | 'year';
const YEAR_SPAN = 12;

const cell =
  'relative rounded-md tabular-nums transition-colors duration-[var(--duration-fast)] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--lume-ring-focus)] disabled:cursor-not-allowed disabled:opacity-30 disabled:line-through disabled:decoration-[var(--lume-edge-hover)]';

interface CalendarPanelProps {
  /** The chosen day (`selected` look). */
  selected: Date | null;
  /** Month shown first; defaults to the chosen day's month, else today. */
  initialMonth?: Date;
  onPickDay: (date: Date) => void;
  /** Pick whole months: the grid opens on months and a month click calls this. */
  monthOnly?: boolean;
  onPickMonth?: (firstOfMonth: Date) => void;
  /** Days that cannot be picked (outside min/max, closed days). */
  isDisabled?: (date: Date) => boolean;
  /** Content under the grid, e.g. an "Oggi" button. */
  footer?: ReactNode;
  /** Earliest / latest month the arrows can reach. */
  minMonth?: Date;
  maxMonth?: Date;
  /** `lg` = the phone booking page: 44px cells and a plain month title (no
   *  stepping out to months and years). */
  size?: 'md' | 'lg';
}

/**
 * The one month calendar in Lume: day grid, with the title stepping out to the
 * months of the year and then to pages of years. Chosen = `selected`, today =
 * `marker-current`, one hover glide across the cells. Used inside DateField and
 * the calendar's date picker; render it inside a <FloatingPanel> or inline.
 */
export function CalendarPanel({
  selected,
  initialMonth,
  onPickDay,
  monthOnly = false,
  onPickMonth,
  isDisabled,
  footer,
  minMonth,
  maxMonth,
  size = 'md',
}: CalendarPanelProps) {
  const today = useMemo(() => new Date(), []);
  const drillDown = size === 'md';
  const start = initialMonth ?? selected ?? today;
  const [mode, setMode] = useState<Mode>(monthOnly ? 'month' : 'day');
  const [display, setDisplay] = useState<Date>(start);
  const [yearPage, setYearPage] = useState(() => Math.floor(start.getFullYear() / YEAR_SPAN) * YEAR_SPAN);

  const gridRef = useRef<HTMLDivElement>(null);
  const glowRef = useHoverGlide(gridRef, '[data-list-row]');

  const days = useMemo(() => getMonthDays(display), [display]);
  const monthLabels = useMemo(
    () => Array.from({ length: 12 }, (_, i) => capitalize(formatDateString(new Date(2000, i, 1), 'MMM'))),
    [],
  );
  const years = Array.from({ length: YEAR_SPAN }, (_, i) => yearPage + i);

  const step = (dir: 1 | -1) => {
    if (mode === 'day') setDisplay(dir === 1 ? addMonths(display, 1) : subMonths(display, 1));
    else if (mode === 'month') setDisplay(setYear(display, display.getFullYear() + dir));
    else setYearPage((p) => p + dir * YEAR_SPAN);
  };

  const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();
  const canPrev = mode !== 'day' || !minMonth || monthKey(display) > monthKey(minMonth);
  const canNext = mode !== 'day' || !maxMonth || monthKey(display) < monthKey(maxMonth);

  const pickMonth = (i: number) => {
    const next = setMonth(display, i);
    if (monthOnly) onPickMonth?.(startOfMonth(next));
    else { setDisplay(next); setMode('day'); }
  };

  const state = (chosen: boolean, current: boolean) =>
    chosen ? 'selected' : current ? 'marker-current' : 'text-[var(--lume-text)]';

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <Button variant="ghost" size={size === 'lg' ? 'lg' : 'sm'} iconOnly aria-label="Precedente" disabled={!canPrev} onClick={() => step(-1)}>
          <ChevronLeft />
        </Button>
        {drillDown ? (
          <Button
            variant="ghost"
            size="sm"
            className="font-medium text-[var(--lume-text)]"
            onClick={() => setMode(mode === 'day' ? 'month' : mode === 'month' ? 'year' : monthOnly ? 'month' : 'day')}
          >
            {mode === 'day' && capitalize(formatDateString(display, 'MMMM yyyy'))}
            {mode === 'month' && display.getFullYear()}
            {mode === 'year' && `${years[0]} – ${years[years.length - 1]}`}
          </Button>
        ) : (
          <p className="text-base font-medium text-[var(--lume-text)]" aria-live="polite">
            {capitalize(formatDateString(display, 'MMMM yyyy'))}
          </p>
        )}
        <Button variant="ghost" size={size === 'lg' ? 'lg' : 'sm'} iconOnly aria-label="Successivo" disabled={!canNext} onClick={() => step(1)}>
          <ChevronRight />
        </Button>
      </div>

      <div ref={gridRef} className="relative">
        <span ref={glowRef} className="hover-glide" aria-hidden />

        {mode === 'day' && (
          <>
            <div className="mb-1 grid grid-cols-7" aria-hidden>
              {weekDays.map((d) => (
                <div key={d} className="py-1 text-center text-xs text-[var(--lume-text-muted)]">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {days.map(({ date, isCurrentMonth }) => {
                const chosen = !!selected && isSameDay(date, selected);
                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    data-list-row=""
                    aria-pressed={chosen}
                    aria-label={formatDateString(date, 'EEEE d MMMM yyyy')}
                    disabled={isDisabled?.(date)}
                    onClick={() => onPickDay(date)}
                    className={cn(
                      cell, size === 'lg' ? 'h-11 tabular-nums text-sm' : 'h-9 pointer-coarse:h-11 tabular-nums text-[length:var(--lume-control-text-sm)]',
                      state(chosen, isSameDay(date, today)),
                      !chosen && !isCurrentMonth && 'text-[var(--lume-text-secondary)]',
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {mode === 'month' && (
          <div className="grid grid-cols-3 gap-1">
            {monthLabels.map((label, i) => {
              const chosen = monthOnly && !!selected
                ? selected.getFullYear() === display.getFullYear() && selected.getMonth() === i
                : i === display.getMonth();
              const current = today.getFullYear() === display.getFullYear() && today.getMonth() === i;
              return (
                <button key={label} type="button" data-list-row="" onClick={() => pickMonth(i)} className={cn(cell, 'py-2 text-sm', state(chosen, current))}>
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {mode === 'year' && (
          <div className="grid grid-cols-3 gap-1">
            {years.map((year) => (
              <button
                key={year}
                type="button"
                data-list-row=""
                onClick={() => { setDisplay(setYear(display, year)); setMode('month'); }}
                className={cn(cell, 'py-2 text-sm', state(year === display.getFullYear(), year === today.getFullYear()))}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>

      {footer && <div className="mt-3 border-t border-line pt-3">{footer}</div>}
    </div>
  );
}
