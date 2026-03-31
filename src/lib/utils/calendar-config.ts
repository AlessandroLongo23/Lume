export interface CalendarConfig {
  daily: { startHour: number; endHour: number; timeStep: number };
}

export const CALENDAR_CONFIG: CalendarConfig = {
  daily: {
    startHour: 9,
    endHour: 20,
    timeStep: 15,
  },
};

export function generateTimeSlots(date: Date): Date[] {
  const { startHour, endHour, timeStep } = CALENDAR_CONFIG.daily;
  const slots: Date[] = [];

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += timeStep) {
      if (hour === endHour && minute > 0) break;
      const slot: Date = new Date(date);
      slot.setHours(hour, minute);
      slots.push(slot);
    }
  }

  return slots;
}

export function formatTimeSlot(timeSlot: Date): string {
  return timeSlot.toTimeString().substring(0, 5);
}
