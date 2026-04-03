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
    const since = new Date();
    since.setDate(since.getDate() - 90);
    const { data, error } = await supabase
      .from('fiche_services')
      .select('*')
      .gte('start_time', since.toISOString());
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
    const newFicheService = new FicheService(data);
    set((s) => ({ fiche_services: [...s.fiche_services, newFicheService] }));
    return newFicheService;
  },

  updateFicheService: async (id, updated) => {
    const { data, error } = await supabase
      .from('fiche_services')
      .update(updated)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error('Impossibile aggiornare il servizio della fiche.');
    const updatedFs = new FicheService(data);
    set((s) => ({ fiche_services: s.fiche_services.map((fs) => (fs.id === id ? updatedFs : fs)) }));
    return updatedFs;
  },

  deleteFicheService: async (id) => {
    const { error } = await supabase.from('fiche_services').delete().eq('id', id);
    if (error) throw new Error('Impossibile eliminare il servizio dalla fiche.');
    set((s) => ({ fiche_services: s.fiche_services.filter((fs) => fs.id !== id) }));
  },
}));
