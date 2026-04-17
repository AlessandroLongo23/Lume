import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { ClientRating, type RawClientRating } from '@/lib/types/ClientRating';

interface ClientRatingsState {
  ratings: Record<string, ClientRating>;
  isLoading: boolean;
  error: string | null;
  fetchClientRatings: () => Promise<void>;
}

export const useClientRatingsStore = create<ClientRatingsState>((set) => ({
  ratings: {},
  isLoading: true,
  error: null,

  fetchClientRatings: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('client_ratings').select('*');
    if (error) { set({ isLoading: false, error: error.message }); return; }
    const ratings: Record<string, ClientRating> = {};
    for (const row of data as RawClientRating[]) {
      const r = new ClientRating(row);
      ratings[r.client_id] = r;
    }
    set({ ratings, isLoading: false, error: null });
  },
}));
