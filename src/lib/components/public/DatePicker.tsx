'use client';

import { useMemo } from 'react';
import { format, isBefore, startOfDay } from 'date-fns';
import type { OperatingHourDay } from '@/lib/stores/salonSettings';
import type { PublicClosure } from '@/lib/booking/publicTypes';
import { CalendarPanel } from '@/lib/components/shared/ui/forms/CalendarPanel';

function isOpenWeekday(operating: OperatingHourDay[], jsDay: number): boolean {
  const entry = operating.find((o) => o.day === jsDay);
  return Boolean(entry?.isOpen && entry.shifts?.length);
}

function inClosure(closures: PublicClosure[], day: Date): boolean {
  const iso = format(day, 'yyyy-MM-dd');
  return closures.some((c) => iso >= c.starts_on && iso <= c.ends_on);
}

/** The booking page's day picker: the shared month grid, 44px cells, closed days off. */
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

  const isDayDisabled = (day: Date): boolean =>
    isBefore(day, today) ||
    isBefore(lastBookableDay, day) ||
    !isOpenWeekday(operatingHours, day.getDay()) ||
    inClosure(closures, day);

  return (
    // Inside the step card already: no second card around it. On wide screens
    // the month keeps a calendar's proportions instead of stretching.
    <div className="mx-auto w-full max-w-md">
      <CalendarPanel
        selected={selectedDate}
        initialMonth={selectedDate ?? today}
        onPickDay={onSelect}
        isDisabled={isDayDisabled}
        minMonth={today}
        maxMonth={lastBookableDay}
        size="lg"
      />
    </div>
  );
}
