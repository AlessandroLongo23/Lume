import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { ServiceCategory, type RawServiceCategory } from '@/lib/types/ServiceCategory';

interface ServiceCategoriesState {
  service_categories: ServiceCategory[];
  isLoading: boolean;
  error: string | null;
  fetchServiceCategories: () => Promise<void>;
  addServiceCategory: (category: Partial<ServiceCategory>) => Promise<ServiceCategory>;
  updateServiceCategory: (id: string, updated: Partial<ServiceCategory>) => Promise<ServiceCategory>;
  deleteServiceCategory: (id: string) => Promise<void>;
}

export const useServiceCategoriesStore = create<ServiceCategoriesState>((set) => ({
  service_categories: [],
  isLoading: true,
  error: null,

  fetchServiceCategories: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('service_categories').select('*, services(count)');
    if (error) { set({ isLoading: false, error: error.message }); return; }
    set({ service_categories: data.map((c) => new ServiceCategory(c as RawServiceCategory)), isLoading: false, error: null });
  },

  addServiceCategory: async (category) => {
    const { data, error } = await supabase.from('service_categories').insert([category]).select().single();
    if (error) throw new Error('Impossibile aggiungere la categoria.');
    return new ServiceCategory(data);
  },

  updateServiceCategory: async (id, updated) => {
    const { data, error } = await supabase.from('service_categories').update(updated).eq('id', id).select().single();
    if (error) throw new Error('Impossibile aggiornare la categoria.');
    return new ServiceCategory(data);
  },

  deleteServiceCategory: async (id) => {
    const { error } = await supabase.from('service_categories').delete().eq('id', id);
    if (error) throw new Error('Impossibile eliminare la categoria.');
  },
}));
