import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { fetchAllPages } from '@/lib/supabase/paginate';
import { FichePayment } from '@/lib/types/FichePayment';
import type { FichePaymentMethod } from '@/lib/types/fichePaymentMethod';

interface FichePaymentsState {
  fiche_payments: FichePayment[];
  isLoading: boolean;
  error: string | null;
  fetchFichePayments: () => Promise<void>;
  /** Changes how an already registered payment was made; the amount is untouched. */
  updateFichePaymentMethod: (paymentId: string, method: FichePaymentMethod) => Promise<void>;
}

export const useFichePaymentsStore = create<FichePaymentsState>((set) => ({
  fiche_payments: [],
  isLoading: false,
  error: null,

  fetchFichePayments: async () => {
    set({ isLoading: true });
    const { data, error } = await fetchAllPages<FichePayment>(
      (from, to) =>
        supabase
          .from('fiche_payments')
          .select('*')
          .order('id', { ascending: true })
          .range(from, to),
    );
    if (error) {
      set({ isLoading: false, error });
      return;
    }
    set({ fiche_payments: data.map((fp) => new FichePayment(fp)), isLoading: false, error: null });
  },

  updateFichePaymentMethod: async (paymentId, method) => {
    const { data, error } = await supabase
      .from('fiche_payments')
      .update({ method })
      .eq('id', paymentId)
      .select()
      .single();
    if (error) throw new Error('Impossibile cambiare il metodo di pagamento.');
    const updated = new FichePayment(data);
    set((s) => ({
      fiche_payments: s.fiche_payments.map((fp) => (fp.id === paymentId ? updated : fp)),
    }));
  },
}));
