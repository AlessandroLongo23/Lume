export interface Shift {
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}

export interface DaySchedule {
  day: number;    // 0 = Sunday … 6 = Saturday  (matches Date.getDay())
  isOpen: boolean;
  shifts: Shift[];
}

/**
 * Resolve the schedule that applies to a given operator.
 * Operators with a custom `working_hours` array use it; otherwise they
 * inherit the salon-wide schedule.
 */
export function effectiveScheduleFor(
  operatorWorkingHours: DaySchedule[] | null | undefined,
  salonHours: DaySchedule[],
): DaySchedule[] {
  if (Array.isArray(operatorWorkingHours) && operatorWorkingHours.length > 0) {
    return operatorWorkingHours;
  }
  return salonHours;
}

/** Parse "HH:mm" → total minutes since midnight */
function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m ?? 0);
}

export interface Bounds {
  startHour: number;
  endHour: number;
}

/**
 * Extend grid bounds so any appointment whose service range falls
 * outside the schedule is still fully visible. Hours are rounded
 * outward (floor for start, ceil for end) so partial hours render
 * as a complete row.
 */
export function extendBoundsForRanges(
  base: Bounds,
  ranges: { start: Date; end: Date }[],
): Bounds {
  let startHour = base.startHour;
  let endHour = base.endHour;
  for (const { start, end } of ranges) {
    startHour = Math.min(startHour, start.getHours());
    const endMin = end.getHours() * 60 + end.getMinutes();
    endHour = Math.max(endHour, Math.ceil(endMin / 60));
  }
  return { startHour, endHour };
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

/**
 * Returns true when the entire [start, end] range fits inside a single
 * configured shift for the range's weekday. Crossing a break, starting
 * before opening, or ending after closing all return false.
 *
 * Returns true unconditionally when `schedule` is empty so the check
 * doesn't block anything while settings are still loading.
 */
export function isRangeWithinHours(
  schedule: DaySchedule[],
  start: Date,
  end: Date,
): boolean {
  if (schedule.length === 0) return true;
  if (end.getTime() <= start.getTime()) return true;

  // Ranges that cross midnight are always considered out-of-hours.
  if (
    start.getFullYear() !== end.getFullYear() ||
    start.getMonth() !== end.getMonth() ||
    start.getDate() !== end.getDate()
  ) {
    return false;
  }

  const daySchedule = schedule.find((d) => d.day === start.getDay());
  if (!daySchedule?.isOpen || daySchedule.shifts.length === 0) return false;

  const startMin = start.getHours() * 60 + start.getMinutes();
  const endMin = end.getHours() * 60 + end.getMinutes();

  return daySchedule.shifts.some((shift) => {
    const shiftStart = parseTime(shift.start);
    const shiftEnd = parseTime(shift.end);
    return startMin >= shiftStart && endMin <= shiftEnd;
  });
}
