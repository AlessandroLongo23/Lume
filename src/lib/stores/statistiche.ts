// src/lib/stores/statistiche.ts
import { create } from 'zustand';
import {
  startOfMonth, startOfYear, endOfYear, subDays, subMonths,
  endOfDay, startOfDay, format, parseISO,
} from 'date-fns';
import { it } from 'date-fns/locale';
import { supabase } from '@/lib/supabase/client';
import type { StatisticheMese, StatisticheResult } from '@/lib/types/Statistiche';

/** `anno_2023` is a whole past calendar year; `custom` is a range typed in "Dal / Al". */
export type YearPreset = `anno_${number}`;
export type QuickPreset = '7d' | 'month' | '3m' | 'year';
export type Preset = QuickPreset | YearPreset | 'custom';

function presetDates(preset: QuickPreset | YearPreset): { from: Date; to: Date } {
  const today = endOfDay(new Date());
  if (preset.startsWith('anno_')) {
    const jan1 = new Date(Number(preset.slice('anno_'.length)), 0, 1);
    return { from: jan1, to: endOfYear(jan1) };
  }
  switch (preset as QuickPreset) {
    case '7d':
      return { from: startOfDay(subDays(new Date(), 6)), to: today };
    case 'month':
      return { from: startOfMonth(new Date()), to: today };
    case '3m':
      return { from: startOfMonth(subMonths(new Date(), 2)), to: today };
    case 'year':
      return { from: startOfYear(new Date()), to: today };
  }
}

export interface MonthlyEarnings {
  label: string; // e.g. "mag 26"
  earnings: number;
}

interface StatisticheState {
  dateFrom: Date;
  dateTo: Date;
  preset: Preset;

  /** Everything the five sections show for the period, computed by public.statistiche(). */
  data: StatisticheResult | null;
  /** First load of the page: nothing to show yet. */
  isLoading: boolean;
  /** A new period is loading while the previous one stays on screen. */
  isRefreshing: boolean;
  error: string | null;

  // 13-month historical trend (independent of period picker)
  historicalEarnings: MonthlyEarnings[];
  isHistoricalLoading: boolean;

  setPreset: (preset: QuickPreset | YearPreset) => void;
  /** A range typed in "Dal / Al": `from` at the start of its day, `to` at the end. */
  setRange: (from: Date, to: Date) => void;
  fetchForPeriod: (from: Date, to: Date) => Promise<void>;
  fetchHistoricalEarnings: () => Promise<void>;
}

const ymd = (d: Date) => format(d, 'yyyy-MM-dd');

// Only the latest period request may write to the store: an older one that
// answers late would put another period's numbers under the current dates.
let periodRequestId = 0;

export const useStatisticheStore = create<StatisticheState>((set, get) => {
  const initial = presetDates('month');
  return {
    dateFrom: initial.from,
    dateTo: initial.to,
    preset: 'month',
    data: null,
    isLoading: true, // the layout loads the period as soon as it mounts
    isRefreshing: false,
    error: null,
    historicalEarnings: [],
    isHistoricalLoading: false,

    setPreset: (preset) => {
      const { from, to } = presetDates(preset);
      set({ preset, dateFrom: from, dateTo: to });
      get().fetchForPeriod(from, to);
    },

    setRange: (from, to) => {
      set({ preset: 'custom', dateFrom: from, dateTo: to });
      get().fetchForPeriod(from, to);
    },

    fetchForPeriod: async (from, to) => {
      const id = ++periodRequestId;
      const first = get().data === null;
      set({ isLoading: first, isRefreshing: !first, error: null });

      const { data, error } = await supabase.rpc('statistiche', { p_from: ymd(from), p_to: ymd(to) });
      if (id !== periodRequestId) return; // a newer period was requested meanwhile

      if (error) {
        set({
          isLoading: false,
          isRefreshing: false,
          error: 'Impossibile caricare le statistiche. Riprova tra qualche istante.',
        });
        return;
      }
      set({ data: data as StatisticheResult | null, isLoading: false, isRefreshing: false });
    },

    fetchHistoricalEarnings: async () => {
      set({ isHistoricalLoading: true });
      const { data, error } = await supabase.rpc('statistiche_andamento', { p_mesi: 13 });
      if (error) {
        set({ isHistoricalLoading: false });
        return;
      }
      const months = ((data ?? []) as StatisticheMese[]).map((m) => ({
        label: format(parseISO(`${m.mese}-01`), 'MMM yy', { locale: it }),
        earnings: m.incasso,
      }));
      set({ historicalEarnings: months, isHistoricalLoading: false });
    },
  };
});
