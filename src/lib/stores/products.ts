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
  deleteAllProducts: () => Promise<void>;
  adjustStock: (id: string, delta: number) => Promise<void>;
  setShowArchived: (show: boolean) => void;
  bulkUpdateProducts: (ids: string[], patch: Partial<Pick<Product, 'manufacturer_id' | 'product_category_id' | 'supplier_id'>>) => Promise<void>;
  bulkArchiveProducts: (ids: string[]) => Promise<void>;
  bulkRestoreProducts: (ids: string[]) => Promise<void>;
  bulkDeleteProducts: (ids: string[]) => Promise<void>;
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  showArchived: false,
  isLoading: true,
  error: null,

  fetchProducts: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('products_with_stats').select('*');
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

  deleteAllProducts: async () => {
    const response = await fetch('/api/admin/delete-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'products' }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    set({ products: [] });
  },

  adjustStock: async (id, delta) => {
    const previous = get().products.find((p) => p.id === id)?.stock_quantity ?? 0;
    set((s) => ({
      products: s.products.map((p) =>
        p.id === id ? new Product({ ...p, stock_quantity: p.stock_quantity + delta } as Product) : p
      ),
    }));
    const response = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'adjust-stock', delta }),
    });
    const result = await response.json();
    if (!result.success) {
      set((s) => ({
        products: s.products.map((p) =>
          p.id === id ? new Product({ ...p, stock_quantity: previous } as Product) : p
        ),
      }));
      throw new Error(result.error);
    }
  },

  setShowArchived: (show) => set({ showArchived: show }),

  bulkUpdateProducts: async (ids, patch) => {
    const response = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bulk-update', ids, patch }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    set((s) => ({
      products: s.products.map((p) =>
        ids.includes(p.id) ? new Product({ ...p, ...patch } as Product) : p
      ),
    }));
  },

  bulkArchiveProducts: async (ids) => {
    const response = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bulk-archive', ids }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    const archived_at = new Date().toISOString();
    set((s) => ({
      products: s.products.map((p) =>
        ids.includes(p.id) ? new Product({ ...p, archived_at } as Product) : p
      ),
    }));
  },

  bulkRestoreProducts: async (ids) => {
    const response = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bulk-restore', ids }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    set((s) => ({
      products: s.products.map((p) =>
        ids.includes(p.id) ? new Product({ ...p, archived_at: null } as Product) : p
      ),
    }));
  },

  bulkDeleteProducts: async (ids) => {
    const response = await fetch('/api/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    set((s) => ({ products: s.products.filter((p) => !ids.includes(p.id)) }));
  },
}));
