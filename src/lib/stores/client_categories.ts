import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { ClientCategory, type RawClientCategory } from '@/lib/types/ClientCategory';
import { useWorkspaceStore } from '@/lib/stores/workspace';

interface ClientCategoriesState {
  client_categories: ClientCategory[];
  isLoading: boolean;
  error: string | null;
  fetchClientCategories: () => Promise<void>;
  addClientCategory: (category: Partial<ClientCategory>) => Promise<ClientCategory>;
  updateClientCategory: (id: string, updated: Partial<ClientCategory>) => Promise<ClientCategory>;
  deleteClientCategory: (id: string) => Promise<void>;
}

export const useClientCategoriesStore = create<ClientCategoriesState>((set) => ({
  client_categories: [],
  isLoading: true,
  error: null,

  fetchClientCategories: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('client_categories').select('*, clients(count)');
    if (error) { set({ isLoading: false, error: error.message }); return; }
    set({ client_categories: data.map((c) => new ClientCategory(c as RawClientCategory)), isLoading: false, error: null });
  },

  addClientCategory: async (category) => {
    const activeSalonId = useWorkspaceStore.getState().activeSalonId;
    if (!activeSalonId) throw new Error('Nessun salone attivo selezionato.');
    const { data, error } = await supabase.from('client_categories').insert([{ ...category, salon_id: activeSalonId }]).select().single();
    if (error) throw new Error('Impossibile aggiungere la categoria.');
    return new ClientCategory(data);
  },

  updateClientCategory: async (id, updated) => {
    const { data, error } = await supabase.from('client_categories').update(updated).eq('id', id).select().single();
    if (error) throw new Error('Impossibile aggiornare la categoria.');
    return new ClientCategory(data);
  },

  deleteClientCategory: async (id) => {
    const { error } = await supabase.from('client_categories').delete().eq('id', id);
    if (error) throw new Error('Impossibile eliminare la categoria.');
  },
}));
