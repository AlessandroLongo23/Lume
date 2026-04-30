import { create } from 'zustand';

type CalendarView = 'day' | 'week' | 'month';

interface CalendarState {
  currentView: CalendarView;
  selectedDate: Date;
  currentMonth: Date;
  selectedOperatorId: string | null;

  setView: (view: CalendarView) => void;
  setSelectedDate: (date: Date) => void;
  setCurrentMonth: (month: Date) => void;
  setSelectedOperatorId: (id: string | null) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  currentView: 'day',
  selectedDate: new Date(),
  currentMonth: new Date(),
  selectedOperatorId: null,

  setView: (view) => set({ currentView: view }),

  setSelectedDate: (date) => set({ selectedDate: date }),

  setCurrentMonth: (month) => set({ currentMonth: month }),

  setSelectedOperatorId: (id) => set({ selectedOperatorId: id }),
}));
