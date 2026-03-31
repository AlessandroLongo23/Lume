import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Fiche } from '@/lib/types/Fiche';

interface FichesState {
  fiches: Fiche[];
  isLoading: boolean;
  error: string | null;
  selectedFiche: Fiche | null;
  fetchFiches: () => Promise<void>;
  addFiche: (fiche: Partial<Fiche>) => Promise<Fiche>;
  updateFiche: (ficheId: string, updatedFiche: Partial<Fiche>) => Promise<Fiche>;
  deleteFiche: (ficheId: string) => Promise<void>;
  setSelectedFiche: (fiche: Fiche | null) => void;
}

export const useFichesStore = create<FichesState>((set) => ({
  fiches: [],
  isLoading: true,
  error: null,
  selectedFiche: null,

  fetchFiches: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('fiches').select('*');
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    set({ fiches: data.map((f) => new Fiche(f)), isLoading: false, error: null });
  },

  addFiche: async (fiche) => {
    const { data, error } = await supabase.from('fiches').insert([fiche]).select().single();
    if (error) throw new Error('Impossibile aggiungere la fiche.');
    return new Fiche(data);
  },

  updateFiche: async (ficheId, updatedFiche) => {
    const { data, error } = await supabase
      .from('fiches')
      .update(updatedFiche)
      .eq('id', ficheId)
      .select()
      .single();
    if (error) throw new Error('Impossibile aggiornare la fiche.');
    return new Fiche(data);
  },

  deleteFiche: async (ficheId) => {
    const { error } = await supabase.from('fiches').delete().eq('id', ficheId);
    if (error) throw new Error('Impossibile eliminare la fiche.');
  },

  setSelectedFiche: (fiche) => set({ selectedFiche: fiche }),
}));
