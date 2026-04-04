import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Product } from '@/lib/types/Product';
import { useWorkspaceStore } from '@/lib/stores/workspace';

interface ProductsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string, updated: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
}

export const useProductsStore = create<ProductsState>((set) => ({
  products: [],
  isLoading: true,
  error: null,

  fetchProducts: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('products').select('*');
    if (error) { set({ isLoading: false, error: error.message }); return; }
    set({ products: data.map((p) => new Product(p)), isLoading: false, error: null });
  },

  addProduct: async (product) => {
    const activeSalonId = useWorkspaceStore.getState().activeSalonId;
    if (!activeSalonId) throw new Error('Nessun salone attivo selezionato.');
    const { data, error } = await supabase.from('products').insert([{ ...product, salon_id: activeSalonId }]).select().single();
    if (error) throw new Error('Impossibile aggiungere il prodotto.');
    return new Product(data);
  },

  updateProduct: async (id, updated) => {
    const { data, error } = await supabase.from('products').update(updated).eq('id', id).select().single();
    if (error) throw new Error('Impossibile aggiornare il prodotto.');
    return new Product(data);
  },

  deleteProduct: async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error('Impossibile eliminare il prodotto.');
  },
}));
