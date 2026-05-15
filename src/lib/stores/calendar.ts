import { create } from 'zustand';

type CalendarView = 'day' | 'week' | 'month';

const SELECTED_OPERATORS_KEY = 'lume-calendar-selected-operator-ids';
const ALL_OPERATORS_SENTINEL = '__ALL__';
const FOCUSED_OPERATOR_KEY = 'lume-calendar-focused-operator-id';
const VIEW_KEY = 'lume-calendar-view';
const VIEW_VALUES = ['day', 'week', 'month'] as const;

export interface HoveredTime {
  date: Date;
  /** Minutes from midnight at the hovered cell start. */
  minutes: number;
  operatorId?: string;
}

interface CalendarState {
  currentView: CalendarView;
  selectedDate: Date;
  currentMonth: Date;
  /**
   * Operators visible in day view. `null` means "all" (sentinel) and is the default;
   * an empty array means "none selected". A non-empty array means that explicit subset.
   */
  selectedOperatorIds: string[] | null;
  /** Operator focused in week view (single-operator by design). */
  focusedOperatorId: string | null;
  /** Live cursor-over-cell time, used by the calendar header preview. */
  hoveredTime: HoveredTime | null;

  setView: (view: CalendarView) => void;
  setSelectedDate: (date: Date) => void;
  setCurrentMonth: (month: Date) => void;
  setSelectedOperatorIds: (ids: string[] | null) => void;
  setFocusedOperatorId: (id: string | null) => void;
  setHoveredTime: (hovered: HoveredTime | null) => void;
}

function readPersistedSelection(): string[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SELECTED_OPERATORS_KEY);
    if (raw === null) return null;
    if (raw === ALL_OPERATORS_SENTINEL) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'string')) return parsed;
    return null;
  } catch {
    return null;
  }
}

function persistSelection(ids: string[] | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (ids === null) {
      window.localStorage.setItem(SELECTED_OPERATORS_KEY, ALL_OPERATORS_SENTINEL);
    } else {
      window.localStorage.setItem(SELECTED_OPERATORS_KEY, JSON.stringify(ids));
    }
  } catch {
    // ignore quota / privacy errors
  }
}

function readPersistedFocus(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(FOCUSED_OPERATOR_KEY);
    return raw && raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

function persistFocus(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id === null) {
      window.localStorage.removeItem(FOCUSED_OPERATOR_KEY);
    } else {
      window.localStorage.setItem(FOCUSED_OPERATOR_KEY, id);
    }
  } catch {
    // ignore quota / privacy errors
  }
}

function readPersistedView(): CalendarView {
  if (typeof window === 'undefined') return 'day';
  try {
    const raw = window.localStorage.getItem(VIEW_KEY);
    if (raw && (VIEW_VALUES as readonly string[]).includes(raw)) {
      return raw as CalendarView;
    }
    return 'day';
  } catch {
    return 'day';
  }
}

function persistView(view: CalendarView): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(VIEW_KEY, view);
  } catch {
    // ignore quota / privacy errors
  }
}

export const useCalendarStore = create<CalendarState>((set) => ({
  currentView: readPersistedView(),
  selectedDate: new Date(),
  currentMonth: new Date(),
  selectedOperatorIds: readPersistedSelection(),
  focusedOperatorId: readPersistedFocus(),
  hoveredTime: null,

  setView: (view) => {
    persistView(view);
    set({ currentView: view });
  },

  setSelectedDate: (date) => set({ selectedDate: date }),

  setCurrentMonth: (month) => set({ currentMonth: month }),

  setSelectedOperatorIds: (ids) => {
    persistSelection(ids);
    set({ selectedOperatorIds: ids });
  },

  setFocusedOperatorId: (id) => {
    persistFocus(id);
    set({ focusedOperatorId: id });
  },

  setHoveredTime: (hovered) => set({ hoveredTime: hovered }),
}));
