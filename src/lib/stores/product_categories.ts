import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { ProductCategory } from '@/lib/types/ProductCategory';

interface ProductCategoriesState {
  product_categories: ProductCategory[];
  isLoading: boolean;
  error: string | null;
  fetchProductCategories: () => Promise<void>;
  addProductCategory: (category: Partial<ProductCategory>) => Promise<ProductCategory>;
  updateProductCategory: (id: string, updated: Partial<ProductCategory>) => Promise<ProductCategory>;
  deleteProductCategory: (id: string) => Promise<void>;
}

export const useProductCategoriesStore = create<ProductCategoriesState>((set) => ({
  product_categories: [],
  isLoading: true,
  error: null,

  fetchProductCategories: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('product_categories').select('*');
    if (error) { set({ isLoading: false, error: error.message }); return; }
    set({ product_categories: data.map((c) => new ProductCategory(c)), isLoading: false, error: null });
  },

  addProductCategory: async (category) => {
    const { data, error } = await supabase.from('product_categories').insert([category]).select().single();
    if (error) throw new Error('Impossibile aggiungere la categoria.');
    return new ProductCategory(data);
  },

  updateProductCategory: async (id, updated) => {
    const { data, error } = await supabase.from('product_categories').update(updated).eq('id', id).select().single();
    if (error) throw new Error('Impossibile aggiornare la categoria.');
    return new ProductCategory(data);
  },

  deleteProductCategory: async (id) => {
    const { error } = await supabase.from('product_categories').delete().eq('id', id);
    if (error) throw new Error('Impossibile eliminare la categoria.');
  },
}));
