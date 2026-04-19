'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { isSameDay, isSameMonth, setMonth, setYear, startOfMonth } from 'date-fns';
import { addMonths, subMonths, getMonthDays, formatDateString, weekDays } from '@/lib/utils/date';
import { capitalize } from '@/lib/utils/string';

type PickerMode = 'day' | 'month' | 'year';

interface CalendarDatePickerProps {
  /** The label rendered on the trigger. */
  label: string;
  /** Date to highlight (for day/week views). */
  selectedDate: Date;
  /** Month to display when opening. */
  currentMonth: Date;
  /** Called with the picked date; parent decides how to apply it per view. */
  onSelect: (date: Date) => void;
  /** Called when the user clicks "Torna a oggi". */
  onGoToToday: () => void;
  /** When true, the grid highlights whole months; clicks close on month pick. */
  monthOnly?: boolean;
}

const YEAR_SPAN = 12; // years shown per page in year picker

export function CalendarDatePicker({
  label,
  selectedDate,
  currentMonth,
  onSelect,
  onGoToToday,
  monthOnly = false,
}: CalendarDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<PickerMode>(monthOnly ? 'month' : 'day');
  const [displayMonth, setDisplayMonth] = useState<Date>(currentMonth);
  const [yearPageStart, setYearPageStart] = useState<number>(
    () => Math.floor(currentMonth.getFullYear() / YEAR_SPAN) * YEAR_SPAN,
  );
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => new Date(), []);
  const monthDays = useMemo(() => getMonthDays(displayMonth), [displayMonth]);

  // Sync displayed month with the parent's current month whenever it changes externally
  useEffect(() => {
    setDisplayMonth(currentMonth);
    setYearPageStart(Math.floor(currentMonth.getFullYear() / YEAR_SPAN) * YEAR_SPAN);
  }, [currentMonth]);

  // Reset internal mode when the trigger type changes
  useEffect(() => {
    if (!isOpen) setMode(monthOnly ? 'month' : 'day');
  }, [isOpen, monthOnly]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        (!portalRef.current || !portalRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Close on scroll so the fixed popover doesn't drift
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => setIsOpen(false);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  function open() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const PICKER_WIDTH = 288;
      const left = Math.max(8, rect.left + rect.width / 2 - PICKER_WIDTH / 2);
      setPos({ top: rect.bottom + 6, left });
    }
    setDisplayMonth(currentMonth);
    setYearPageStart(Math.floor(currentMonth.getFullYear() / YEAR_SPAN) * YEAR_SPAN);
    setMode(monthOnly ? 'month' : 'day');
    setIsOpen(true);
  }

  function toggle() {
    if (isOpen) setIsOpen(false);
    else open();
  }

  function handlePickDay(date: Date) {
    onSelect(date);
    setIsOpen(false);
  }

  function handlePickMonth(monthIndex: number) {
    const next = setMonth(displayMonth, monthIndex);
    if (monthOnly) {
      onSelect(startOfMonth(next));
      setIsOpen(false);
    } else {
      setDisplayMonth(next);
      setMode('day');
    }
  }

  function handlePickYear(year: number) {
    const next = setYear(displayMonth, year);
    setDisplayMonth(next);
    setMode(monthOnly ? 'month' : 'month');
  }

  function handleToday() {
    onGoToToday();
    setIsOpen(false);
  }

  const monthLabels = useMemo(
    () => Array.from({ length: 12 }, (_, i) =>
      capitalize(formatDateString(new Date(2000, i, 1), 'MMM')),
    ),
    [],
  );

  const yearList = useMemo(
    () => Array.from({ length: YEAR_SPAN }, (_, i) => yearPageStart + i),
    [yearPageStart],
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="px-3 py-1 rounded-md text-lg font-medium
          text-zinc-800 dark:text-zinc-100 select-none cursor-pointer
          hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        {label}
      </button>

      {isOpen && pos && createPortal(
        <div
          ref={portalRef}
          role="dialog"
          aria-label="Seleziona data"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: 288, zIndex: 9999 }}
          className="bg-white dark:bg-zinc-800 border border-zinc-500/25 rounded-lg shadow-lg p-3"
        >
          {/* Header: prev / (clickable label) / next */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => {
                if (mode === 'day') setDisplayMonth(subMonths(displayMonth, 1));
                else if (mode === 'month') setDisplayMonth(setYear(displayMonth, displayMonth.getFullYear() - 1));
                else setYearPageStart((p) => p - YEAR_SPAN);
              }}
              aria-label="Precedente"
              className="p-1.5 rounded-md text-zinc-500 dark:text-zinc-400
                hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={() => {
                if (mode === 'day') setMode('month');
                else if (mode === 'month') setMode('year');
                else setMode(monthOnly ? 'month' : 'day');
              }}
              className="px-2 py-1 text-sm font-medium text-zinc-800 dark:text-zinc-100
                rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              {mode === 'day' && capitalize(formatDateString(displayMonth, 'MMMM yyyy'))}
              {mode === 'month' && displayMonth.getFullYear()}
              {mode === 'year' && `${yearList[0]} — ${yearList[yearList.length - 1]}`}
            </button>

            <button
              type="button"
              onClick={() => {
                if (mode === 'day') setDisplayMonth(addMonths(displayMonth, 1));
                else if (mode === 'month') setDisplayMonth(setYear(displayMonth, displayMonth.getFullYear() + 1));
                else setYearPageStart((p) => p + YEAR_SPAN);
              }}
              aria-label="Successivo"
              className="p-1.5 rounded-md text-zinc-500 dark:text-zinc-400
                hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day grid */}
          {mode === 'day' && (
            <>
              <div className="grid grid-cols-7 mb-1">
                {weekDays.map((d) => (
                  <div
                    key={d}
                    className="text-center text-2xs font-medium uppercase tracking-wider
                      text-zinc-500 dark:text-zinc-400 py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {monthDays.map(({ date, isCurrentMonth }) => {
                  const isSelected = isSameDay(date, selectedDate);
                  const isToday = isSameDay(date, today);
                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      onClick={() => handlePickDay(date)}
                      className={[
                        'h-8 text-sm rounded-md transition-colors',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                        isSelected
                          ? 'bg-primary text-white hover:bg-primary-hover'
                          : isToday
                            ? 'text-primary-hover dark:text-primary/70 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700'
                            : isCurrentMonth
                              ? 'text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                              : 'text-zinc-400 dark:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700/50',
                      ].join(' ')}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Month grid */}
          {mode === 'month' && (
            <div className="grid grid-cols-3 gap-1">
              {monthLabels.map((label, i) => {
                const isActive = monthOnly
                  ? isSameMonth(new Date(displayMonth.getFullYear(), i, 1), selectedDate)
                  : i === displayMonth.getMonth();
                const isCurrent = today.getFullYear() === displayMonth.getFullYear() && today.getMonth() === i;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handlePickMonth(i)}
                    className={[
                      'py-2 text-sm rounded-md transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                      isActive
                        ? 'bg-primary text-white hover:bg-primary-hover'
                        : isCurrent
                          ? 'text-primary-hover dark:text-primary/70 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700'
                          : 'text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Year grid */}
          {mode === 'year' && (
            <div className="grid grid-cols-3 gap-1">
              {yearList.map((year) => {
                const isActive = year === displayMonth.getFullYear();
                const isCurrent = year === today.getFullYear();
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => handlePickYear(year)}
                    className={[
                      'py-2 text-sm rounded-md transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                      isActive
                        ? 'bg-primary text-white hover:bg-primary-hover'
                        : isCurrent
                          ? 'text-primary-hover dark:text-primary/70 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700'
                          : 'text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700',
                    ].join(' ')}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-zinc-500/25">
            <button
              type="button"
              onClick={handleToday}
              className="w-full py-1.5 text-sm font-medium rounded-md
                text-primary-hover dark:text-primary/70
                hover:bg-primary/10 transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              Torna a oggi
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
