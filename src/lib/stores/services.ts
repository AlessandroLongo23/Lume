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
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw new Error('Impossibile eliminare il servizio.');
  },
}));
