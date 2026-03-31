import { create } from 'zustand';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { subMonths, parseISO } from 'date-fns';

interface EarningsMonth {
  month: string;
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
  hoursByMonth: HoursMonth[];

  setFilter: (type: 'all' | 'operator' | 'product', id?: string | null) => void;
  setTimeRange: (months: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  computeFromFiches: (fiches: any[], ficheServices: any[]) => void;
}

export const useStatsStore = create<StatsState>((set, get) => ({
  filterType: 'all',
  filterId: null,
  timeRange: 6,
  earningsByMonth: [],
  hoursByMonth: [],

  setFilter: (type, id = null) => {
    set({ filterType: type, filterId: id });
  },

  setTimeRange: (months) => {
    set({ timeRange: months });
  },

  computeFromFiches: (fiches, ficheServices) => {
    const { timeRange, filterType, filterId } = get();
    const now = new Date();
    const months: string[] = [];
    for (let i = timeRange - 1; i >= 0; i--) {
      months.push(format(subMonths(now, i), 'MMM yyyy', { locale: it }));
    }

    const earningsByMonth: EarningsMonth[] = months.map((month) => {
        // Find matching fiches
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
        const services = ficheServices.filter((fs) => {
          if (fs.fiche_id !== f.id) return false;
          if (filterType === 'operator' && filterId && fs.operator_id !== filterId) return false;
          if (filterType === 'product' && filterId && fs.service_id !== filterId) return false;
          return true;
        });
        services.forEach((fs) => { total += Number(fs.price) || 0; });
      });

      return { month, earnings: total };
    });

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
        const services = ficheServices.filter((fs) => fs.fiche_id === f.id);
        services.forEach((fs) => { totalMinutes += Number(fs.duration) || 0; });
      });

      return { month, hours: totalMinutes / 60 };
    });

    set({ earningsByMonth, hoursByMonth });
  },
}));
