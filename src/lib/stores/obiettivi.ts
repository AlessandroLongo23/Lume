import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Obiettivi } from '@/lib/types/Obiettivi';
import { useWorkspaceStore } from '@/lib/stores/workspace';

interface ObiettiviState {
  obiettivi: Obiettivi | null;
  isLoading: boolean;
  fetchObiettivi: () => Promise<void>;
  saveObiettivi: (data: Partial<Obiettivi>) => Promise<void>;
}

export const useObiettiviStore = create<ObiettiviState>((set) => ({
  obiettivi: null,
  isLoading: true,

  fetchObiettivi: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('obiettivi').select('*').maybeSingle();
    if (error) { set({ isLoading: false }); return; }
    set({ obiettivi: data ?? null, isLoading: false });
  },

  saveObiettivi: async (updates) => {
    const activeSalonId = useWorkspaceStore.getState().activeSalonId;
    if (!activeSalonId) throw new Error('Nessun salone attivo selezionato.');
    const { data, error } = await supabase
      .from('obiettivi')
      .upsert({ ...updates, salon_id: activeSalonId }, { onConflict: 'salon_id' })
      .select()
      .single();
    if (error) throw new Error('Impossibile salvare gli obiettivi.');
    set({ obiettivi: data });
  },
}));
