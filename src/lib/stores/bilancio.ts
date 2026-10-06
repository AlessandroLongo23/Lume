import { create } from 'zustand';
import {
  differenceInCalendarDays, endOfMonth, endOfYear, format, parseISO,
  startOfMonth, startOfYear, subDays, subMonths, subYears,
} from 'date-fns';
import { supabase } from '@/lib/supabase/client';
import type { BilancioResult } from '@/lib/types/Bilancio';

/** `anno_2023` is a whole past calendar year, offered for as far back as the salon has fiches. */
export type BilancioYearPreset = `anno_${number}`;
export type BilancioPreset =
  | 'questo_mese' | 'mese_scorso' | 'quest_anno' | 'anno_scorso' | 'ultimi_12_mesi'
  | BilancioYearPreset
  | 'personalizzato';

const isYearPreset = (preset: BilancioPreset): preset is BilancioYearPreset => preset.startsWith('anno_') && preset !== 'anno_scorso';

export const BILANCIO_PRESETS: { value: BilancioPreset; label: string }[] = [
  { value: 'questo_mese', label: 'Questo mese' },
  { value: 'mese_scorso', label: 'Mese scorso' },
  { value: 'quest_anno', label: "Quest'anno" },
  { value: 'anno_scorso', label: 'Anno scorso' },
  { value: 'ultimi_12_mesi', label: 'Ultimi 12 mesi' },
  { value: 'personalizzato', label: 'Periodo personalizzato' },
];

const ymd = (d: Date) => format(d, 'yyyy-MM-dd');

function presetRange(preset: Exclude<BilancioPreset, 'personalizzato'>, today = new Date()): { dal: string; al: string } {
  if (isYearPreset(preset)) {
    const year = Number(preset.slice('anno_'.length));
    return { dal: `${year}-01-01`, al: `${year}-12-31` };
  }
  switch (preset) {
    case 'questo_mese':
      return { dal: ymd(startOfMonth(today)), al: ymd(today) };
    case 'mese_scorso': {
      const m = subMonths(today, 1);
      return { dal: ymd(startOfMonth(m)), al: ymd(endOfMonth(m)) };
    }
    case 'quest_anno':
      return { dal: ymd(startOfYear(today)), al: ymd(today) };
    case 'anno_scorso': {
      const y = subYears(today, 1);
      return { dal: ymd(startOfYear(y)), al: ymd(endOfYear(y)) };
    }
    case 'ultimi_12_mesi':
      return { dal: ymd(startOfMonth(subMonths(today, 11))), al: ymd(today) };
  }
}

/**
 * The period the change is measured against. Calendar presets compare like with like
 * (this month so far vs the same days last month, this year so far vs the same days
 * last year); a custom range compares with the same number of days right before it.
 */
function previousRange(preset: BilancioPreset, dal: string, al: string): { dal: string; al: string } {
  const from = parseISO(dal);
  const to = parseISO(al);
  if (isYearPreset(preset)) return { dal: ymd(subYears(from, 1)), al: ymd(subYears(to, 1)) };
  switch (preset) {
    case 'questo_mese':
    case 'mese_scorso':
      return { dal: ymd(subMonths(from, 1)), al: ymd(preset === 'mese_scorso' ? endOfMonth(subMonths(to, 1)) : subMonths(to, 1)) };
    case 'quest_anno':
    case 'anno_scorso':
    case 'ultimi_12_mesi':
      return { dal: ymd(subYears(from, 1)), al: ymd(subYears(to, 1)) };
    case 'personalizzato': {
      const days = differenceInCalendarDays(to, from) + 1;
      return { dal: ymd(subDays(from, days)), al: ymd(subDays(from, 1)) };
    }
  }
}

interface BilancioState {
  preset: BilancioPreset;
  dal: string;
  al: string;
  data: BilancioResult | null;
  previous: BilancioResult | null;
  isLoading: boolean;
  error: string | null;
  setPreset: (preset: Exclude<BilancioPreset, 'personalizzato'>) => void;
  setRange: (dal: string, al: string) => void;
  fetch: () => Promise<void>;
}

const initial = presetRange('questo_mese');
let requestId = 0;

export const useBilancioStore = create<BilancioState>((set, get) => ({
  preset: 'questo_mese',
  dal: initial.dal,
  al: initial.al,
  data: null,
  previous: null,
  isLoading: false,
  error: null,

  setPreset: (preset) => {
    const { dal, al } = presetRange(preset);
    set({ preset, dal, al });
    void get().fetch();
  },

  setRange: (dal, al) => {
    set({ preset: 'personalizzato', dal, al });
    if (dal && al && dal <= al) void get().fetch();
  },

  fetch: async () => {
    const { preset, dal, al } = get();
    const id = ++requestId;
    set({ isLoading: true, error: null });
    const prev = previousRange(preset, dal, al);
    const [cur, before] = await Promise.all([
      supabase.rpc('bilancio', { p_from: dal, p_to: al }),
      supabase.rpc('bilancio', { p_from: prev.dal, p_to: prev.al }),
    ]);
    if (id !== requestId) return; // a newer period was requested meanwhile
    if (cur.error) {
      set({ isLoading: false, error: 'Impossibile caricare il bilancio. Riprova tra qualche istante.' });
      return;
    }
    set({
      data: cur.data as BilancioResult | null,
      previous: before.error ? null : (before.data as BilancioResult | null),
      isLoading: false,
    });
  },
}));
