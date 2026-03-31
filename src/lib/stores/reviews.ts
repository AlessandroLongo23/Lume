import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Review } from '@/lib/types/Review';

interface ReviewsState {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  fetchReviews: () => Promise<void>;
  addReview: (review: Partial<Review>) => Promise<Review>;
  deleteReview: (id: string) => Promise<void>;
}

export const useReviewsStore = create<ReviewsState>((set) => ({
  reviews: [],
  isLoading: true,
  error: null,

  fetchReviews: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('reviews').select('*');
    if (error) { set({ isLoading: false, error: error.message }); return; }
    set({ reviews: data.map((r) => new Review(r)), isLoading: false, error: null });
  },

  addReview: async (review) => {
    const { data, error } = await supabase.from('reviews').insert([review]).select().single();
    if (error) throw new Error('Impossibile aggiungere la recensione.');
    return new Review(data);
  },

  deleteReview: async (id) => {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) throw new Error('Impossibile eliminare la recensione.');
  },
}));
