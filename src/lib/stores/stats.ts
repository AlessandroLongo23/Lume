import { create } from 'zustand';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { subMonths, subWeeks, startOfWeek, startOfMonth, endOfMonth, addDays, differenceInDays, parseISO, isSameDay, isSameWeek } from 'date-fns';

interface EarningsMonth {
  month: string;
  earnings: number;
}

interface EarningsPoint {
  label: string;
  earnings: number;
}

interface HoursMonth {
  month: string;
  hours: number;
}

interface StatsState {
  filterType: 'all' | 'operator' | 'product';
  filterId: string | null;
  timeRange: number; // months

  earningsByMonth: EarningsMonth[];
  earningsByDay: EarningsPoint[];
  earningsByWeek: EarningsPoint[];
  hoursByMonth: HoursMonth[];
  prevPeriodEarnings: number;

  setFilter: (type: 'all' | 'operator' | 'product', id?: string | null) => void;
  setTimeRange: (months: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  computeFromFiches: (fiches: any[], ficheServices: any[], services: any[]) => void;
}

export const useStatsStore = create<StatsState>((set, get) => ({
  filterType: 'all',
  filterId: null,
  timeRange: 6,
  earningsByMonth: [],
  earningsByDay: [],
  earningsByWeek: [],
  hoursByMonth: [],
  prevPeriodEarnings: 0,

  setFilter: (type, id = null) => {
    set({ filterType: type, filterId: id });
  },

  setTimeRange: (months) => {
    set({ timeRange: months });
  },

  computeFromFiches: (fiches, ficheServices, services) => {
    const { timeRange, filterType, filterId } = get();
    // Build a price lookup map: service_id → price
    const priceMap = new Map<string, number>();
    services.forEach((s: { id: string; price: number }) => priceMap.set(s.id, s.price));
    const now = new Date();

    // ── Monthly buckets ──────────────────────────────────────────────────────
    const months: string[] = [];
    for (let i = timeRange - 1; i >= 0; i--) {
      months.push(format(subMonths(now, i), 'MMM yyyy', { locale: it }));
    }

    const earningsByMonth: EarningsMonth[] = months.map((month) => {
      const filtered = fiches.filter((f) => {
        try {
          const d = typeof f.datetime === 'string' ? parseISO(f.datetime) : f.datetime;
          return format(d, 'MMM yyyy', { locale: it }) === month;
        } catch {
          return false;
        }
      });
      let total = 0;
      filtered.forEach((f) => {
        ficheServices
          .filter((fs) => {
            if (fs.fiche_id !== f.id) return false;
            if (filterType === 'operator' && filterId && fs.operator_id !== filterId) return false;
            if (filterType === 'product' && filterId && fs.service_id !== filterId) return false;
            return true;
          })
          .forEach((fs) => { total += priceMap.get(fs.service_id) ?? 0; });
      });
      return { month, earnings: total };
    });

    // ── Daily buckets (current calendar month, day 1 → today) ───────────────
    const monthStart = startOfMonth(now);
    const daysInPeriod = differenceInDays(endOfMonth(now), monthStart) + 1;
    const earningsByDay: EarningsPoint[] = [];
    for (let i = 0; i < daysInPeriod; i++) {
      const day = addDays(monthStart, i);
      const filtered = fiches.filter((f) => {
        try {
          const d = typeof f.datetime === 'string' ? parseISO(f.datetime) : f.datetime;
          return isSameDay(d, day);
        } catch { return false; }
      });
      let total = 0;
      filtered.forEach((f) => {
        ficheServices.filter((fs) => fs.fiche_id === f.id).forEach((fs) => {
          total += priceMap.get(fs.service_id) ?? 0;
        });
      });
      earningsByDay.push({ label: format(day, 'd MMM', { locale: it }), earnings: total });
    }

    // ── Weekly buckets (last 13 weeks) ───────────────────────────────────────
    const earningsByWeek: EarningsPoint[] = [];
    for (let i = 12; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const filtered = fiches.filter((f) => {
        try {
          const d = typeof f.datetime === 'string' ? parseISO(f.datetime) : f.datetime;
          return isSameWeek(d, weekStart, { weekStartsOn: 1 });
        } catch { return false; }
      });
      let total = 0;
      filtered.forEach((f) => {
        ficheServices.filter((fs) => fs.fiche_id === f.id).forEach((fs) => {
          total += priceMap.get(fs.service_id) ?? 0;
        });
      });
      earningsByWeek.push({ label: format(weekStart, 'd MMM', { locale: it }), earnings: total });
    }

    // ── Previous period earnings (for trend %) ───────────────────────────────
    const prevMonths: string[] = [];
    for (let i = timeRange * 2 - 1; i >= timeRange; i--) {
      prevMonths.push(format(subMonths(now, i), 'MMM yyyy', { locale: it }));
    }
    let prevPeriodEarnings = 0;
    fiches.forEach((f) => {
      try {
        const d = typeof f.datetime === 'string' ? parseISO(f.datetime) : f.datetime;
        if (!prevMonths.includes(format(d, 'MMM yyyy', { locale: it }))) return;
        ficheServices.filter((fs) => fs.fiche_id === f.id).forEach((fs) => {
          prevPeriodEarnings += priceMap.get(fs.service_id) ?? 0;
        });
      } catch { /* skip */ }
    });

    // ── Hours ────────────────────────────────────────────────────────────────
    const hoursByMonth: HoursMonth[] = months.map((month) => {
      const filtered = fiches.filter((f) => {
        try {
          const d = typeof f.datetime === 'string' ? parseISO(f.datetime) : f.datetime;
          return format(d, 'MMM yyyy', { locale: it }) === month;
        } catch {
          return false;
        }
      });
      let totalMinutes = 0;
      filtered.forEach((f) => {
        ficheServices.filter((fs) => fs.fiche_id === f.id).forEach((fs) => {
          totalMinutes += Number(fs.duration) || 0;
        });
      });
      return { month, hours: totalMinutes / 60 };
    });

    set({ earningsByMonth, earningsByDay, earningsByWeek, hoursByMonth, prevPeriodEarnings });
  },
}));
