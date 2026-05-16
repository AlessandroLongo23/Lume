'use client';

import { useMemo, useState } from 'react';
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { OperatingHourDay } from '@/lib/stores/salonSettings';
import type { PublicClosure } from '@/lib/booking/publicTypes';

// startOfWeek with weekStartsOn:1 gives Monday-first weeks (Italian convention).
const WEEK_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

function isOpenWeekday(operating: OperatingHourDay[], jsDay: number): boolean {
  const entry = operating.find((o) => o.day === jsDay);
  return Boolean(entry?.isOpen && entry.shifts?.length);
}

function inClosure(closures: PublicClosure[], day: Date): boolean {
  const iso = format(day, 'yyyy-MM-dd');
  return closures.some((c) => iso >= c.starts_on && iso <= c.ends_on);
}

export function DatePicker({
  operatingHours,
  closures,
  maxLeadDays,
  onSelect,
  selectedDate,
}: {
  operatingHours: OperatingHourDay[];
  closures: PublicClosure[];
  maxLeadDays: number;
  onSelect: (date: Date) => void;
  selectedDate: Date | null;
}) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const lastBookableDay = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + maxLeadDays);
    return d;
  }, [today, maxLeadDays]);

  const [displayMonth, setDisplayMonth] = useState<Date>(
    selectedDate ? startOfMonth(selectedDate) : startOfMonth(today),
  );

  const days = useMemo(() => {
    const monthStart = startOfMonth(displayMonth);
    const monthEnd = endOfMonth(displayMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const out: Date[] = [];
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      out.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }, [displayMonth]);

  const canGoPrev = isAfter(startOfMonth(displayMonth), startOfMonth(today));
  const canGoNext = isBefore(startOfMonth(displayMonth), startOfMonth(lastBookableDay));

  const isDayDisabled = (day: Date): boolean => {
    if (isBefore(day, today)) return true;
    if (isBefore(lastBookableDay, day)) return true;
    if (!isOpenWeekday(operatingHours, day.getDay())) return true;
    if (inClosure(closures, day)) return true;
    return false;
  };

  return (
    <div className="rounded-xl border border-[var(--lume-border)] bg-[var(--lume-surface-raised)] p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setDisplayMonth((m) => subMonths(m, 1))}
          disabled={!canGoPrev}
          aria-label="Mese precedente"
          className="size-8 inline-flex items-center justify-center rounded-md text-[var(--lume-text-secondary)] hover:bg-[var(--lume-surface)] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-medium text-[var(--lume-text)] capitalize">
          {format(displayMonth, 'MMMM yyyy', { locale: it })}
        </p>
        <button
          type="button"
          onClick={() => setDisplayMonth((m) => addMonths(m, 1))}
          disabled={!canGoNext}
          aria-label="Mese successivo"
          className="size-8 inline-flex items-center justify-center rounded-md text-[var(--lume-text-secondary)] hover:bg-[var(--lume-surface)] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wider text-[var(--lume-text-muted)]">
        {WEEK_LABELS.map((label) => (
          <div key={label} className="py-1">{label}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, displayMonth);
          const disabled = isDayDisabled(day);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isToday = isSameDay(day, today);
          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(day)}
              className={`relative h-10 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lume-ring-focus)] ${
                !inMonth
                  ? 'text-[var(--lume-text-muted)]/40'
                  : disabled
                  ? 'text-[var(--lume-text-muted)]/40 cursor-not-allowed'
                  : isSelected
                  ? 'bg-[var(--lume-accent)] text-[var(--lume-text-on-accent)] font-medium'
                  : 'text-[var(--lume-text)] hover:bg-[var(--lume-accent-muted)]'
              }`}
            >
              {day.getDate()}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-[var(--lume-accent)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
