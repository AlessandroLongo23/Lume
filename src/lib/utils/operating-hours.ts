export interface Shift {
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}

export interface DaySchedule {
  day: number;    // 0 = Sunday … 6 = Saturday  (matches Date.getDay())
  isOpen: boolean;
  shifts: Shift[];
}

/** Parse "HH:mm" → total minutes since midnight */
function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m ?? 0);
}

/**
 * Scan every open day and return the absolute earliest opening time
 * and latest closing time as whole hours.
 *
 * These drive the vertical grid range so DayView and WeekView always
 * share a consistent row height regardless of the selected day.
 *
 * Fallback: 09:00–20:00 when no schedule data is available.
 */
export function getGridBounds(
  schedule: DaySchedule[],
): { startHour: number; endHour: number } {
  const openDays = schedule.filter((d) => d.isOpen && d.shifts.length > 0);
  if (openDays.length === 0) return { startHour: 9, endHour: 20 };

  let earliestMin = 24 * 60;
  let latestMin = 0;

  for (const day of openDays) {
    for (const shift of day.shifts) {
      earliestMin = Math.min(earliestMin, parseTime(shift.start));
      latestMin = Math.max(latestMin, parseTime(shift.end));
    }
  }

  return {
    startHour: Math.floor(earliestMin / 60),
    // ceil so the final slot row (e.g. 19:45 when end = 20:00) is included
    endHour: Math.ceil(latestMin / 60),
  };
}

/**
 * Returns true when the 15-minute slot beginning at `slotMinutes`
 * falls inside at least one configured shift for the given day of week.
 *
 * Returns true unconditionally when `schedule` is empty so the grid
 * renders fully enabled while settings are still loading.
 */
export function isSlotActive(
  schedule: DaySchedule[],
  dayOfWeek: number,   // 0–6  (Date.getDay())
  slotMinutes: number, // e.g. 9*60 + 30 = 570 for 09:30
): boolean {
  if (schedule.length === 0) return true;

  const daySchedule = schedule.find((d) => d.day === dayOfWeek);
  if (!daySchedule?.isOpen || daySchedule.shifts.length === 0) return false;

  return daySchedule.shifts.some((shift) => {
    const start = parseTime(shift.start);
    const end = parseTime(shift.end);
    return slotMinutes >= start && slotMinutes < end;
  });
}
