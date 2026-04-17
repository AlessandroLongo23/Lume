import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { ServiceCategory, type RawServiceCategory } from '@/lib/types/ServiceCategory';

interface ServiceCategoriesState {
  service_categories: ServiceCategory[];
  showArchived: boolean;
  isLoading: boolean;
  error: string | null;
  fetchServiceCategories: () => Promise<void>;
  addServiceCategory: (category: Partial<ServiceCategory>) => Promise<ServiceCategory>;
  updateServiceCategory: (id: string, updated: Partial<ServiceCategory>) => Promise<ServiceCategory>;
  archiveServiceCategory: (id: string) => Promise<void>;
  restoreServiceCategory: (id: string) => Promise<void>;
  deleteServiceCategory: (id: string) => Promise<void>;
  setShowArchived: (show: boolean) => void;
}

export const useServiceCategoriesStore = create<ServiceCategoriesState>((set) => ({
  service_categories: [],
  showArchived: false,
  isLoading: true,
  error: null,

  fetchServiceCategories: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('service_categories').select('*, services(count)');
    if (error) { set({ isLoading: false, error: error.message }); return; }
    set({ service_categories: data.map((c) => new ServiceCategory(c as RawServiceCategory)), isLoading: false, error: null });
  },

  addServiceCategory: async (category) => {
    const response = await fetch('/api/service-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return new ServiceCategory(result.category);
  },

  updateServiceCategory: async (id, updated) => {
    const response = await fetch('/api/service-categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, category: updated }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return new ServiceCategory(result.category);
  },

  archiveServiceCategory: async (id) => {
    const response = await fetch('/api/service-categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'archive' }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  restoreServiceCategory: async (id) => {
    const response = await fetch('/api/service-categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'restore' }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  deleteServiceCategory: async (id) => {
    const response = await fetch('/api/service-categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  setShowArchived: (show) => set({ showArchived: show }),
}));
