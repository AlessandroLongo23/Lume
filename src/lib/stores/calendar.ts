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

export const useCalendarStore = create<CalendarState>((set, get) => ({
  currentView: 'day',
  selectedDate: new Date(),
  currentMonth: new Date(),
  selectedOperatorId: null,

  setView: (view) => {
    // Week view requires a selected operator — no-op if none set
    if (view === 'week' && !get().selectedOperatorId) return;
    set({ currentView: view });
  },

  setSelectedDate: (date) => set({ selectedDate: date }),

  setCurrentMonth: (month) => set({ currentMonth: month }),

  setSelectedOperatorId: (id) => {
    // Clearing operator while in week view → fall back to day
    if (!id && get().currentView === 'week') {
      set({ selectedOperatorId: null, currentView: 'day' });
    } else {
      set({ selectedOperatorId: id });
    }
  },
}));
