import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Spesa } from '@/lib/types/Spesa';
import { useWorkspaceStore } from '@/lib/stores/workspace';

interface SpeseState {
  spese: Spesa[];
  isLoading: boolean;
  error: string | null;
  fetchSpese: () => Promise<void>;
  addSpesa: (data: Partial<Spesa>) => Promise<Spesa>;
  deleteSpesa: (id: string) => Promise<void>;
}

export const useSpeseStore = create<SpeseState>((set) => ({
  spese: [],
  isLoading: true,
  error: null,

  fetchSpese: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('spese').select('*').order('data', { ascending: false });
    if (error) { set({ isLoading: false, error: error.message }); return; }
    set({ spese: data.map((s) => new Spesa(s)), isLoading: false, error: null });
  },

  addSpesa: async (spesa) => {
    const activeSalonId = useWorkspaceStore.getState().activeSalonId;
    if (!activeSalonId) throw new Error('Nessun salone attivo selezionato.');
    const { data, error } = await supabase.from('spese').insert([{ ...spesa, salon_id: activeSalonId }]).select().single();
    if (error) throw new Error('Impossibile aggiungere la spesa.');
    const newSpesa = new Spesa(data);
    set((s) => ({ spese: [newSpesa, ...s.spese] }));
    return newSpesa;
  },

  deleteSpesa: async (id) => {
    const { error } = await supabase.from('spese').delete().eq('id', id);
    if (error) throw new Error('Impossibile eliminare la spesa.');
    set((s) => ({ spese: s.spese.filter((sp) => sp.id !== id) }));
  },
}));
