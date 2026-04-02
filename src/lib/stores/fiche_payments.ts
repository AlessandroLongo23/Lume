import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { FichePayment } from '@/lib/types/FichePayment';

interface FichePaymentsState {
  fiche_payments: FichePayment[];
  isLoading: boolean;
  error: string | null;
  fetchFichePayments: () => Promise<void>;
}

export const useFichePaymentsStore = create<FichePaymentsState>((set) => ({
  fiche_payments: [],
  isLoading: false,
  error: null,

  fetchFichePayments: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase.from('fiche_payments').select('*');
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    set({ fiche_payments: data.map((fp) => new FichePayment(fp)), isLoading: false, error: null });
  },
}));
