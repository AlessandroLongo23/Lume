import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { ClientStat, type RawClientStat } from '@/lib/types/ClientStat';

interface ClientStatsState {
  stats: Record<string, ClientStat>;
  isLoading: boolean;
  error: string | null;
  fetchClientStats: () => Promise<void>;
}

export const useClientStatsStore = create<ClientStatsState>((set) => ({
  stats: {},
  isLoading: true,
  error: null,

  fetchClientStats: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('client_stats').select('*');
    if (error) { set({ isLoading: false, error: error.message }); return; }
    const stats: Record<string, ClientStat> = {};
    for (const row of data as RawClientStat[]) {
      const s = new ClientStat(row);
      stats[s.client_id] = s;
    }
    set({ stats, isLoading: false, error: null });
  },
}));
