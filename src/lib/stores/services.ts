import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Service } from '@/lib/types/Service';

interface ServicesState {
  services: Service[];
  isLoading: boolean;
  error: string | null;
  fetchServices: () => Promise<void>;
  addService: (service: Partial<Service>) => Promise<Service>;
  updateService: (id: string, updated: Partial<Service>) => Promise<Service>;
  deleteService: (id: string) => Promise<void>;
}

export const useServicesStore = create<ServicesState>((set) => ({
  services: [],
  isLoading: true,
  error: null,

  fetchServices: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('services').select('*');
    if (error) { set({ isLoading: false, error: error.message }); return; }
    set({ services: data.map((s) => new Service(s)), isLoading: false, error: null });
  },

  addService: async (service) => {
    const { data, error } = await supabase.from('services').insert([service]).select().single();
    if (error) throw new Error('Impossibile aggiungere il servizio.');
    return new Service(data);
  },

  updateService: async (id, updated) => {
    const { data, error } = await supabase.from('services').update(updated).eq('id', id).select().single();
    if (error) throw new Error('Impossibile aggiornare il servizio.');
    return new Service(data);
  },

  deleteService: async (id) => {
    // Find all fiches that reference this service
    const { data: ficheServicesData, error: fsQueryError } = await supabase
      .from('fiche_services')
      .select('fiche_id')
      .eq('service_id', id);
    if (fsQueryError) throw new Error('Impossibile recuperare le fiche associate al servizio.');

    const ficheIds = [...new Set((ficheServicesData ?? []).map((fs) => fs.fiche_id))];

    if (ficheIds.length > 0) {
      // Delete fiche_services rows for those fiches first (FK constraint)
      const { error: fsDeleteError } = await supabase
        .from('fiche_services')
        .delete()
        .in('fiche_id', ficheIds);
      if (fsDeleteError) throw new Error('Impossibile eliminare i servizi delle fiche associate.');

      // Delete the fiches themselves
      const { error: fichesError } = await supabase
        .from('fiches')
        .delete()
        .in('id', ficheIds);
      if (fichesError) throw new Error('Impossibile eliminare le fiche associate al servizio.');
    }

    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw new Error('Impossibile eliminare il servizio.');
  },
}));
