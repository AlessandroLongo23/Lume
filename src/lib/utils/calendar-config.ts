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

export function generateTimeSlots(
  date: Date,
  bounds?: { startHour: number; endHour: number },
  timeStep: number = CALENDAR_CONFIG.daily.timeStep,
): Date[] {
  const startHour = bounds?.startHour ?? CALENDAR_CONFIG.daily.startHour;
  const endHour = bounds?.endHour ?? CALENDAR_CONFIG.daily.endHour;
  const slots: Date[] = [];

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += timeStep) {
      const slot: Date = new Date(date);
      slot.setHours(hour, minute, 0, 0);
      slots.push(slot);
    }
  }

  return slots;
}

export function formatTimeSlot(timeSlot: Date): string {
  return timeSlot.toTimeString().substring(0, 5);
}
