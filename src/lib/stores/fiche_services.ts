import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { FicheService } from '@/lib/types/FicheService';

interface FicheServicesState {
  fiche_services: FicheService[];
  isLoading: boolean;
  error: string | null;
  fetchFicheServices: () => Promise<void>;
  addFicheService: (ficheService: Partial<FicheService>) => Promise<FicheService>;
  updateFicheService: (id: string, updated: Partial<FicheService>) => Promise<FicheService>;
  deleteFicheService: (id: string) => Promise<void>;
}

export const useFicheServicesStore = create<FicheServicesState>((set) => ({
  fiche_services: [],
  isLoading: true,
  error: null,

  fetchFicheServices: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('fiche_services').select('*');
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    set({ fiche_services: data.map((fs) => new FicheService(fs)), isLoading: false, error: null });
  },

  addFicheService: async (ficheService) => {
    const { data, error } = await supabase
      .from('fiche_services')
      .insert([ficheService])
      .select()
      .single();
    if (error) throw new Error('Impossibile aggiungere il servizio alla fiche.');
    return new FicheService(data);
  },

  updateFicheService: async (id, updated) => {
    const { data, error } = await supabase
      .from('fiche_services')
      .update(updated)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error('Impossibile aggiornare il servizio della fiche.');
    return new FicheService(data);
  },

  deleteFicheService: async (id) => {
    const { error } = await supabase.from('fiche_services').delete().eq('id', id);
    if (error) throw new Error('Impossibile eliminare il servizio dalla fiche.');
  },
}));
