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
