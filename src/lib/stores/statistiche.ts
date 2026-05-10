// src/lib/stores/statistiche.ts
import { create } from 'zustand';
import {
  startOfMonth, startOfYear, subDays, subMonths,
  endOfDay, startOfDay, format,
} from 'date-fns';
import { it } from 'date-fns/locale';
import { supabase } from '@/lib/supabase/client';
import { Fiche } from '@/lib/types/Fiche';
import { FicheService } from '@/lib/types/FicheService';
import { FicheProduct } from '@/lib/types/FicheProduct';
import { FichePayment } from '@/lib/types/FichePayment';
import { FicheStatus } from '@/lib/types/ficheStatus';
import { useFicheProductsStore } from '@/lib/stores/fiche_products';

export type Preset = '7d' | 'month' | '3m' | 'year';

function presetDates(preset: Preset): { from: Date; to: Date } {
  const today = endOfDay(new Date());
  switch (preset) {
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
  label: string; // e.g. "mag 2026"
  earnings: number;
}

interface StatisticheState {
  dateFrom: Date;
  dateTo: Date;
  preset: Preset;

  // Period-filtered data (fetched from DB for selected range)
  statFiches: Fiche[];
  statFicheServices: FicheService[];
  statFicheProducts: FicheProduct[];
  statFichePayments: FichePayment[];
  isLoading: boolean;
  error: string | null;

  // 13-month historical trend (independent of period picker)
  historicalEarnings: MonthlyEarnings[];
  isHistoricalLoading: boolean;

  setPreset: (preset: Preset) => void;
  setDateFrom: (date: Date) => void;
  setDateTo: (date: Date) => void;
  fetchForPeriod: (from: Date, to: Date) => Promise<void>;
  fetchHistoricalEarnings: () => Promise<void>;
}

export const useStatisticheStore = create<StatisticheState>((set, get) => {
  const initial = presetDates('month');
  return {
    dateFrom: initial.from,
    dateTo: initial.to,
    preset: 'month',
    statFiches: [],
    statFicheServices: [],
    statFicheProducts: [],
    statFichePayments: [],
    isLoading: false,
    error: null,
    historicalEarnings: [],
    isHistoricalLoading: false,

    setPreset: (preset) => {
      const { from, to } = presetDates(preset);
      set({ preset, dateFrom: from, dateTo: to });
      get().fetchForPeriod(from, to);
    },

    setDateFrom: (date) => set({ dateFrom: date, preset: 'month' }),
    setDateTo: (date) => set({ dateTo: date, preset: 'month' }),

    fetchForPeriod: async (from, to) => {
      set({ isLoading: true, error: null });
      const { data: fichesData, error: fichesErr } = await supabase
        .from('fiches')
        .select('*')
        .eq('status', FicheStatus.COMPLETED)
        .gte('datetime', from.toISOString())
        .lte('datetime', to.toISOString());

      if (fichesErr) {
        set({ isLoading: false, error: fichesErr.message });
        return;
      }
      const fiches = (fichesData ?? []).map((f) => new Fiche(f));
      const ficheIds = fiches.map((f) => f.id);

      if (ficheIds.length === 0) {
        set({
          statFiches: [],
          statFicheServices: [],
          statFicheProducts: [],
          statFichePayments: [],
          isLoading: false,
        });
        return;
      }

      const [servRes, prodRes, payRes] = await Promise.all([
        supabase.from('fiche_services').select('*').in('fiche_id', ficheIds),
        supabase.from('fiche_products').select('*').in('fiche_id', ficheIds),
        supabase.from('fiche_payments').select('*').in('fiche_id', ficheIds),
      ]);

      set({
        statFiches: fiches,
        statFicheServices: (servRes.data ?? []).map((s) => new FicheService(s)),
        statFicheProducts: (prodRes.data ?? []).map((p) => new FicheProduct(p)),
        statFichePayments: (payRes.data ?? []).map((p) => new FichePayment(p)),
        isLoading: false,
        error: servRes.error?.message ?? prodRes.error?.message ?? payRes.error?.message ?? null,
      });
    },

    fetchHistoricalEarnings: async () => {
      set({ isHistoricalLoading: true });
      const since = startOfMonth(subMonths(new Date(), 12));

      const [fichesRes, servicesRes] = await Promise.all([
        supabase
          .from('fiches')
          .select('id, datetime, total_override')
          .eq('status', FicheStatus.COMPLETED)
          .gte('datetime', since.toISOString()),
        supabase
          .from('fiche_services')
          .select('fiche_id, final_price')
          .gte('start_time', since.toISOString()),
      ]);

      const allFicheProducts = useFicheProductsStore.getState().fiche_products;

      // Build per-fiche sum maps
      const serviceSums = new Map<string, number>();
      for (const s of servicesRes.data ?? []) {
        serviceSums.set(s.fiche_id, (serviceSums.get(s.fiche_id) ?? 0) + s.final_price);
      }
      const productSums = new Map<string, number>();
      for (const p of allFicheProducts) {
        productSums.set(p.fiche_id, (productSums.get(p.fiche_id) ?? 0) + p.final_price * p.quantity);
      }

      // Group by YYYY-MM
      const byMonth = new Map<string, number>();
      for (const f of fichesRes.data ?? []) {
        const key = f.datetime.slice(0, 7); // "YYYY-MM"
        const total = f.total_override ?? ((serviceSums.get(f.id) ?? 0) + (productSums.get(f.id) ?? 0));
        byMonth.set(key, (byMonth.get(key) ?? 0) + total);
      }

      // Build last 13 months array (oldest → newest)
      const months: MonthlyEarnings[] = [];
      for (let i = 12; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const key = format(d, 'yyyy-MM');
        months.push({
          label: format(d, 'MMM yy', { locale: it }),
          earnings: byMonth.get(key) ?? 0,
        });
      }

      set({ historicalEarnings: months, isHistoricalLoading: false });
    },
  };
});
