import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { ProductCategory } from '@/lib/types/ProductCategory';

interface ProductCategoriesState {
  product_categories: ProductCategory[];
  showArchived: boolean;
  isLoading: boolean;
  error: string | null;
  fetchProductCategories: () => Promise<void>;
  addProductCategory: (category: Partial<ProductCategory>) => Promise<ProductCategory>;
  updateProductCategory: (id: string, updated: Partial<ProductCategory>) => Promise<ProductCategory>;
  archiveProductCategory: (id: string) => Promise<void>;
  restoreProductCategory: (id: string) => Promise<void>;
  deleteProductCategory: (id: string) => Promise<void>;
  setShowArchived: (show: boolean) => void;
}

export const useProductCategoriesStore = create<ProductCategoriesState>((set) => ({
  product_categories: [],
  showArchived: false,
  isLoading: true,
  error: null,

  fetchProductCategories: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('product_categories').select('*');
    if (error) { set({ isLoading: false, error: error.message }); return; }
    set({ product_categories: data.map((c) => new ProductCategory(c)), isLoading: false, error: null });
  },

  addProductCategory: async (category) => {
    const response = await fetch('/api/product-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return new ProductCategory(result.category);
  },

  updateProductCategory: async (id, updated) => {
    const response = await fetch('/api/product-categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, category: updated }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return new ProductCategory(result.category);
  },

  archiveProductCategory: async (id) => {
    const response = await fetch('/api/product-categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'archive' }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  restoreProductCategory: async (id) => {
    const response = await fetch('/api/product-categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'restore' }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  deleteProductCategory: async (id) => {
    const response = await fetch('/api/product-categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  setShowArchived: (show) => set({ showArchived: show }),
}));
