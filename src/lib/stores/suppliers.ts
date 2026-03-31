import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Supplier } from '@/lib/types/Supplier';

interface SuppliersState {
  suppliers: Supplier[];
  isLoading: boolean;
  error: string | null;
  fetchSuppliers: () => Promise<void>;
  addSupplier: (supplier: Partial<Supplier>) => Promise<Supplier>;
  updateSupplier: (id: string, updated: Partial<Supplier>) => Promise<Supplier>;
  deleteSupplier: (id: string) => Promise<void>;
}

export const useSuppliersStore = create<SuppliersState>((set) => ({
  suppliers: [],
  isLoading: true,
  error: null,

  fetchSuppliers: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('suppliers').select('*');
    if (error) { set({ isLoading: false, error: error.message }); return; }
    set({ suppliers: data.map((s) => new Supplier(s)), isLoading: false, error: null });
  },

  addSupplier: async (supplier) => {
    const { data, error } = await supabase.from('suppliers').insert([supplier]).select().single();
    if (error) throw new Error('Impossibile aggiungere il fornitore.');
    return new Supplier(data);
  },

  updateSupplier: async (id, updated) => {
    const { data, error } = await supabase.from('suppliers').update(updated).eq('id', id).select().single();
    if (error) throw new Error('Impossibile aggiornare il fornitore.');
    return new Supplier(data);
  },

  deleteSupplier: async (id) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw new Error('Impossibile eliminare il fornitore.');
  },
}));
