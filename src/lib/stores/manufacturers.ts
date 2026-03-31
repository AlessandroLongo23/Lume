import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Manufacturer } from '@/lib/types/Manufacturer';

interface ManufacturersState {
  manufacturers: Manufacturer[];
  isLoading: boolean;
  error: string | null;
  fetchManufacturers: () => Promise<void>;
  addManufacturer: (manufacturer: Partial<Manufacturer>) => Promise<Manufacturer>;
  updateManufacturer: (id: string, updated: Partial<Manufacturer>) => Promise<Manufacturer>;
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
    const { data, error } = await supabase.from('manufacturers').insert([manufacturer]).select().single();
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
