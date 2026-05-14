import { create } from 'zustand';
import posthog from 'posthog-js';
import { supabase } from '@/lib/supabase/client';
import { fetchAllPages } from '@/lib/supabase/paginate';
import { Client } from '@/lib/types/Client';

interface ClientsState {
  clients: Client[];
  showArchived: boolean;
  isLoading: boolean;
  error: string | null;
  selectedClient: Client | null;
  fetchClients: () => Promise<void>;
  addClient: (clientData: Partial<Client>) => Promise<Client>;
  updateClient: (clientId: string, updatedClient: Partial<Client>) => Promise<Client>;
  updateClientContact: (clientId: string, contact: { email?: string; phonePrefix?: string; phoneNumber?: string }) => Promise<void>;
  archiveClient: (clientId: string) => Promise<void>;
  restoreClient: (clientId: string) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  deleteAllClients: () => Promise<void>;
  setSelectedClient: (client: Client | null) => void;
  setShowArchived: (show: boolean) => void;
}

export const useClientsStore = create<ClientsState>((set) => ({
  clients: [],
  showArchived: false,
  isLoading: true,
  error: null,
  selectedClient: null,

  fetchClients: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await fetchAllPages<ConstructorParameters<typeof Client>[0]>(
      (from, to) =>
        supabase
          .from('clients')
          .select('*')
          .order('id', { ascending: true })
          .range(from, to),
    );
    if (error) {
      set({ isLoading: false, error });
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
    posthog.capture('client_created', { client_id: newClient.id });
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

  updateClientContact: async (clientId, contact) => {
    const response = await fetch('/api/clients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: clientId, action: 'updateContact', ...contact }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  archiveClient: async (clientId) => {
    const response = await fetch('/api/clients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: clientId, action: 'archive' }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  restoreClient: async (clientId) => {
    const response = await fetch('/api/clients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: clientId, action: 'restore' }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
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

  deleteAllClients: async () => {
    const response = await fetch('/api/admin/delete-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'clients' }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    set({ clients: [] });
  },

  setSelectedClient: (client) => set({ selectedClient: client }),
  setShowArchived: (show) => set({ showArchived: show }),
}));
