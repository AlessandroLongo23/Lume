import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { fetchAllPages } from '@/lib/supabase/paginate';
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
    // paged: one row per client, and salons can pass PostgREST's 1000-row cap
    const { data, error } = await fetchAllPages<RawClientRating>((from, to) =>
      supabase.from('client_ratings').select('*').order('client_id').range(from, to),
    );
    if (error) { set({ isLoading: false, error }); return; }
    const ratings: Record<string, ClientRating> = {};
    for (const row of data) {
      const r = new ClientRating(row);
      ratings[r.client_id] = r;
    }
    set({ ratings, isLoading: false, error: null });
  },
}));
