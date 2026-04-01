import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Client } from '@/lib/types/Client';

interface ClientsState {
  clients: Client[];
  isLoading: boolean;
  error: string | null;
  selectedClient: Client | null;
  fetchClients: () => Promise<void>;
  addClient: (clientData: Partial<Client>) => Promise<Client>;
  updateClient: (clientId: string, updatedClient: Partial<Client>) => Promise<Client>;
  deleteClient: (clientId: string) => Promise<void>;
  setSelectedClient: (client: Client | null) => void;
}

export const useClientsStore = create<ClientsState>((set) => ({
  clients: [],
  isLoading: true,
  error: null,
  selectedClient: null,

  fetchClients: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('clients').select('*');
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    set({ clients: data.map((c) => new Client(c)), isLoading: false, error: null });
  },

  addClient: async (clientData) => {
    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client: clientData }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    const newClient = new Client(result.client);
    set((s) => ({ clients: [...s.clients, newClient] }));
    return newClient;
  },

  updateClient: async (clientId, updatedClient) => {
    const { data, error } = await supabase
      .from('clients')
      .update(updatedClient)
      .eq('id', clientId)
      .select()
      .single();
    if (error) throw new Error('Impossibile aggiornare il cliente.');
    return new Client(data);
  },

  deleteClient: async (clientId) => {
    const response = await fetch('/api/clients', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: clientId }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  setSelectedClient: (client) => set({ selectedClient: client }),
}));
