import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Review, type ReviewRow } from '@/lib/types/Review';

interface ReviewsState {
  myReview: Review | null;
  isLoading: boolean;
  error: string | null;
  fetchMyReview: () => Promise<void>;
  upsertMyReview: (data: { rating: number; message: string }) => Promise<Review>;
  deleteMyReview: () => Promise<void>;
}

export const useReviewsStore = create<ReviewsState>((set) => ({
  myReview: null,
  isLoading: true,
  error: null,

  fetchMyReview: async () => {
    set((s) => ({ ...s, isLoading: true }));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ myReview: null, isLoading: false, error: null });
      return;
    }

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('author_id', user.id)
      .maybeSingle();

    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }

    set({
      myReview: data ? new Review(data as ReviewRow) : null,
      isLoading: false,
      error: null,
    });
  },

  upsertMyReview: async ({ rating, message }) => {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, message }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error ?? 'Errore sconosciuto');
    const review = new Review(result.review);
    set({ myReview: review });
    return review;
  },

  deleteMyReview: async () => {
    const res = await fetch('/api/reviews', { method: 'DELETE' });
    const result = await res.json();
    if (!result.success) throw new Error(result.error ?? 'Errore sconosciuto');
    set({ myReview: null });
  },
}));
