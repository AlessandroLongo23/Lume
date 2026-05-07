import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Fiche } from '@/lib/types/Fiche';
import type { FichePaymentMethod } from '@/lib/types/fichePaymentMethod';
import { useWorkspaceStore } from '@/lib/stores/workspace';

export interface PaymentSplit {
  method: FichePaymentMethod;
  amount: number;
}

interface FichesState {
  fiches: Fiche[];
  isLoading: boolean;
  error: string | null;
  selectedFiche: Fiche | null;
  /** Fiche ids whose realtime echo should be ignored (we just wrote them locally). */
  pendingMutationIds: Set<string>;
  fetchFiches: () => Promise<void>;
  addFiche: (fiche: Partial<Fiche>) => Promise<Fiche>;
  updateFiche: (ficheId: string, updatedFiche: Partial<Fiche>) => Promise<Fiche>;
  deleteFiche: (ficheId: string) => Promise<void>;
  deleteAllFiches: () => Promise<void>;
  setSelectedFiche: (fiche: Fiche | null) => void;
  closeFiche: (ficheId: string, salonId: string, payments: PaymentSplit[]) => Promise<void>;
}

export const useFichesStore = create<FichesState>((set) => ({
  fiches: [],
  isLoading: true,
  error: null,
  selectedFiche: null,
  pendingMutationIds: new Set<string>(),

  fetchFiches: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const since = new Date();
    since.setDate(since.getDate() - 90);
    const { data, error } = await supabase
      .from('fiches')
      .select('*')
      .gte('datetime', since.toISOString())
      .limit(10000);
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    set({ fiches: data.map((f) => new Fiche(f)), isLoading: false, error: null });
  },

  addFiche: async (fiche) => {
    const activeSalonId = useWorkspaceStore.getState().activeSalonId;
    if (!activeSalonId) throw new Error('Nessun salone attivo selezionato.');
    const { data, error } = await supabase.from('fiches').insert([{ ...fiche, salon_id: activeSalonId }]).select().single();
    if (error) throw new Error('Impossibile aggiungere la fiche.');
    const newFiche = new Fiche(data);
    set((s) => ({ fiches: [...s.fiches, newFiche] }));
    return newFiche;
  },

  updateFiche: async (ficheId, updatedFiche) => {
    const { data, error } = await supabase
      .from('fiches')
      .update(updatedFiche)
      .eq('id', ficheId)
      .select()
      .single();
    if (error) throw new Error('Impossibile aggiornare la fiche.');
    const updated = new Fiche(data);
    set((s) => ({ fiches: s.fiches.map((f) => (f.id === ficheId ? updated : f)) }));
    return updated;
  },

  deleteFiche: async (ficheId) => {
    const { error: fsError } = await supabase.from('fiche_services').delete().eq('fiche_id', ficheId);
    if (fsError) throw new Error('Impossibile eliminare i servizi della fiche.');
    const { error } = await supabase.from('fiches').delete().eq('id', ficheId);
    if (error) throw new Error('Impossibile eliminare la fiche.');
    set((s) => ({ fiches: s.fiches.filter((f) => f.id !== ficheId) }));
  },

  deleteAllFiches: async () => {
    const response = await fetch('/api/admin/delete-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'fiches' }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    set({ fiches: [] });
  },

  setSelectedFiche: (fiche) => set({ selectedFiche: fiche }),

  closeFiche: async (ficheId, salonId, payments) => {
    const previousStatus = useFichesStore.getState().fiches.find((f) => f.id === ficheId)?.status;

    // Step 1: mark fiche as completed
    const { error: ficheErr } = await supabase
      .from('fiches')
      .update({ status: 'completed' })
      .eq('id', ficheId);
    if (ficheErr) throw new Error('Impossibile aggiornare lo stato della fiche.');

    // Step 2: insert payment rows — rollback if this fails
    const rows = payments.map((p) => ({
      fiche_id: ficheId,
      salon_id: salonId,
      method: p.method,
      amount: p.amount,
    }));
    const { error: payErr } = await supabase.from('fiche_payments').insert(rows);
    if (payErr) {
      // Rollback: restore previous status
      if (previousStatus) {
        await supabase.from('fiches').update({ status: previousStatus }).eq('id', ficheId);
      }
      throw new Error('Impossibile registrare il pagamento. Stato della fiche ripristinato.');
    }

    // Update local fiches state
    set((s) => ({
      fiches: s.fiches.map((f) =>
        f.id === ficheId ? new Fiche({ ...f, status: 'completed' as typeof f.status }) : f
      ),
    }));

    // fiche_payments store will be synced via realtime subscription in StoreInitializer
  },
}));
