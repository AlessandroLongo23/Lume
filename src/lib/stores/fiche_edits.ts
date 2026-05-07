import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { FicheEdit } from '@/lib/types/FicheEdit';

interface FicheEditsState {
  fiche_edits: FicheEdit[];
  isLoading: boolean;
  error: string | null;
  fetchFicheEdits: () => Promise<void>;
  getByFicheId: (ficheId: string) => FicheEdit[];
}

export const useFicheEditsStore = create<FicheEditsState>((set, get) => ({
  fiche_edits: [],
  isLoading: false,
  error: null,

  fetchFicheEdits: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('fiche_edits')
      .select('*')
      .order('edited_at', { ascending: false });
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    set({ fiche_edits: data.map((fe) => new FicheEdit(fe)), isLoading: false, error: null });
  },

  getByFicheId: (ficheId: string) => {
    return get().fiche_edits.filter((fe) => fe.fiche_id === ficheId);
  },
}));
