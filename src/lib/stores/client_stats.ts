import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { fetchAllPages } from '@/lib/supabase/paginate';
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
    // paged: one row per client, and salons easily pass PostgREST's 1000-row cap
    const { data, error } = await fetchAllPages<RawClientStat>((from, to) =>
      supabase.from('client_stats').select('*').order('client_id').range(from, to),
    );
    if (error) { set({ isLoading: false, error }); return; }
    const stats: Record<string, ClientStat> = {};
    for (const row of data) {
      const s = new ClientStat(row);
      stats[s.client_id] = s;
    }
    set({ stats, isLoading: false, error: null });
  },
}));
