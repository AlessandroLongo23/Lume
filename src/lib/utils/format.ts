import { format as formatDate, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDateDisplay = (date: string | Date, formatStr = 'PP'): string => {
  if (!date) return '';
  const dateObj: Date = typeof date === 'string' ? parseISO(date) : date;
  return formatDate(dateObj, formatStr, { locale: it });
};

export const formatTime = (timeString: string): string => {
  if (!timeString) return '';

  let hours: number, minutes: number;

  if (timeString.includes('T')) {
    const date = new Date(timeString);
    hours = date.getHours();
    minutes = date.getMinutes();
  } else {
    [hours, minutes] = timeString.split(':').map(Number);
  }

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const formatDuration = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return '';

  const [startHours, startMinutes]: number[] = startTime.split(':').map(Number);
  const [endHours, endMinutes]: number[] = endTime.split(':').map(Number);

  const startTotalMinutes: number = startHours * 60 + startMinutes;
  const endTotalMinutes: number = endHours * 60 + endMinutes;
  let diffMinutes: number = endTotalMinutes - startTotalMinutes;

  if (diffMinutes < 0) diffMinutes += 24 * 60;

  const hours: number = Math.floor(diffMinutes / 60);
  const minutes: number = diffMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

export const calculateEarnings = (
  startTime: string,
  endTime: string,
  hourlyRate: number
): number => {
  if (!startTime || !endTime || !hourlyRate) return 0;

  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  const startTotalHours: number = startHours + startMinutes / 60;
  const endTotalHours: number = endHours + endMinutes / 60;
  let durationHours: number = endTotalHours - startTotalHours;

  if (durationHours < 0) durationHours += 24;

  return durationHours * hourlyRate;
};
