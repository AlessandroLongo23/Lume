import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Product } from '@/lib/types/Product';

interface ProductsState {
  products: Product[];
  showArchived: boolean;
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string, updated: Partial<Product>) => Promise<Product>;
  archiveProduct: (id: string) => Promise<void>;
  restoreProduct: (id: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  setShowArchived: (show: boolean) => void;
}

export const useProductsStore = create<ProductsState>((set) => ({
  products: [],
  showArchived: false,
  isLoading: true,
  error: null,

  fetchProducts: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('products').select('*');
    if (error) { set({ isLoading: false, error: error.message }); return; }
    set({ products: data.map((p) => new Product(p)), isLoading: false, error: null });
  },

  addProduct: async (product) => {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return new Product(result.product);
  },

  updateProduct: async (id, updated) => {
    const response = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, product: updated }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return new Product(result.product);
  },

  archiveProduct: async (id) => {
    const response = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'archive' }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  restoreProduct: async (id) => {
    const response = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'restore' }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  deleteProduct: async (id) => {
    const response = await fetch('/api/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  setShowArchived: (show) => set({ showArchived: show }),
}));
