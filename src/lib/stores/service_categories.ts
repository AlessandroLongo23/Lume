import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { ServiceCategory, type RawServiceCategory } from '@/lib/types/ServiceCategory';
import { useWorkspaceStore } from '@/lib/stores/workspace';

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
    const activeSalonId = useWorkspaceStore.getState().activeSalonId;
    if (!activeSalonId) throw new Error('Nessun salone attivo selezionato.');
    const { data, error } = await supabase.from('service_categories').insert([{ ...category, salon_id: activeSalonId }]).select().single();
    if (error) throw new Error('Impossibile aggiungere la categoria.');
    return new ServiceCategory(data);
  },

  updateServiceCategory: async (id, updated) => {
    const { data, error } = await supabase.from('service_categories').update(updated).eq('id', id).select().single();
    if (error) throw new Error('Impossibile aggiornare la categoria.');
    return new ServiceCategory(data);
  },

  deleteServiceCategory: async (id) => {
    // 1. Find all services in this category
    const { data: services, error: sErr } = await supabase
      .from('services')
      .select('id')
      .eq('category_id', id);
    if (sErr) throw new Error('Impossibile eliminare la categoria.');

    const serviceIds = (services ?? []).map((s) => s.id);

    if (serviceIds.length > 0) {
      // 2. Find all fiches that reference these services
      const { data: ficheServices, error: fsErr } = await supabase
        .from('fiche_services')
        .select('fiche_id')
        .in('service_id', serviceIds);
      if (fsErr) throw new Error('Impossibile eliminare la categoria.');

      const ficheIds = [...new Set((ficheServices ?? []).map((fs) => fs.fiche_id))];

      if (ficheIds.length > 0) {
        // 3. Delete fiche_services rows first
        const { error: fsDelErr } = await supabase.from('fiche_services').delete().in('fiche_id', ficheIds);
        if (fsDelErr) throw new Error('Impossibile eliminare la categoria.');

        // 4. Delete the fiches
        const { error: fDelErr } = await supabase.from('fiches').delete().in('id', ficheIds);
        if (fDelErr) throw new Error('Impossibile eliminare la categoria.');
      }

      // 5. Delete the services
      const { error: svDelErr } = await supabase.from('services').delete().in('id', serviceIds);
      if (svDelErr) throw new Error('Impossibile eliminare la categoria.');
    }

    // 6. Finally delete the category
    const { error } = await supabase.from('service_categories').delete().eq('id', id);
    if (error) throw new Error('Impossibile eliminare la categoria.');
  },
}));
