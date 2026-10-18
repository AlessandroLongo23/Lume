import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Manufacturer } from '@/lib/types/Manufacturer';
import type { TablesInsert, TablesUpdate } from '@/lib/supabase/types';
import { useWorkspaceStore } from '@/lib/stores/workspace';

interface ManufacturersState {
  manufacturers: Manufacturer[];
  isLoading: boolean;
  error: string | null;
  fetchManufacturers: () => Promise<void>;
  addManufacturer: (manufacturer: Omit<TablesInsert<'manufacturers'>, 'salon_id'>) => Promise<Manufacturer>;
  updateManufacturer: (id: string, updated: TablesUpdate<'manufacturers'>) => Promise<Manufacturer>;
  deleteManufacturer: (id: string) => Promise<void>;
}

export const useManufacturersStore = create<ManufacturersState>((set) => ({
  manufacturers: [],
  isLoading: true,
  error: null,

  fetchManufacturers: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('manufacturers').select('*');
    if (error) { set({ isLoading: false, error: error.message }); return; }
    set({ manufacturers: data.map((m) => new Manufacturer(m)), isLoading: false, error: null });
  },

  addManufacturer: async (manufacturer) => {
    const activeSalonId = useWorkspaceStore.getState().activeSalonId;
    if (!activeSalonId) throw new Error('Nessun salone attivo selezionato.');
    const { data, error } = await supabase.from('manufacturers').insert([{ ...manufacturer, salon_id: activeSalonId }]).select().single();
    if (error) throw new Error('Impossibile aggiungere il produttore.');
    return new Manufacturer(data);
  },

  updateManufacturer: async (id, updated) => {
    const { data, error } = await supabase.from('manufacturers').update(updated).eq('id', id).select().single();
    if (error) throw new Error('Impossibile aggiornare il produttore.');
    return new Manufacturer(data);
  },

  deleteManufacturer: async (id) => {
    const { error } = await supabase.from('manufacturers').delete().eq('id', id);
    if (error) throw new Error('Impossibile eliminare il produttore.');
  },
}));
