import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
  addDays,
  subDays,
} from 'date-fns';
import { it } from 'date-fns/locale';

export const weekDays: string[] = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export function formatDateString(date: string | Date, formatString = 'PP'): string {
  return format(date, formatString, { locale: it });
}

export function isSelectedDate(date: string | Date, selectedDate: Date): boolean {
  return isSameDay(date, selectedDate);
}

export function getMonthDays(currentMonth: Date): { date: Date; isCurrentMonth: boolean }[] {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  let startPadding: number = monthStart.getDay() - 1;
  if (startPadding === -1) startPadding = 6;

  const paddedStart: Date = subDays(monthStart, startPadding);

  const daysInMonth: Date[] = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const totalCalendarDays: number = Math.ceil((daysInMonth.length + startPadding) / 7) * 7;
  const endPadding: number = totalCalendarDays - daysInMonth.length - startPadding;
  const paddedEnd: Date = addDays(monthEnd, endPadding);

  return eachDayOfInterval({ start: paddedStart, end: paddedEnd }).map((date: Date) => ({
    date,
    isCurrentMonth: date.getMonth() === currentMonth.getMonth(),
  }));
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end: addDays(start, 6) });
}

export { addMonths, subMonths };

export function daysUntilBirthday(birthDate: string | Date, now: Date = new Date()): number | null {
  const dob = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  if (!dob || Number.isNaN(dob.getTime())) return null;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const month = dob.getMonth();
  const day = dob.getDate();

  const candidate = (year: number) => {
    const d = new Date(year, month, day);
    // Feb 29 → Feb 28 on non-leap years so the badge still fires that week.
    if (d.getMonth() !== month) return new Date(year, month + 1, 0);
    return d;
  };

  let next = candidate(today.getFullYear());
  if (next < today) next = candidate(today.getFullYear() + 1);

  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}
