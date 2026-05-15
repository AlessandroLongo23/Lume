import { create } from 'zustand';
import posthog from 'posthog-js';
import { supabase } from '@/lib/supabase/client';
import { fetchAllPages } from '@/lib/supabase/paginate';
import { Client } from '@/lib/types/Client';

interface AddClientOptions {
  /** When false, skips creating an auth.users row even if phone/email is set. */
  createAccount?: boolean;
  /** Tag for analytics — e.g. 'fiche_quick_add' to track the quick-add flow. */
  source?: string;
}

interface ClientsState {
  clients: Client[];
  showArchived: boolean;
  isLoading: boolean;
  error: string | null;
  selectedClient: Client | null;
  fetchClients: () => Promise<void>;
  addClient: (clientData: Partial<Client>, opts?: AddClientOptions) => Promise<Client>;
  updateClient: (clientId: string, updatedClient: Partial<Client>) => Promise<Client>;
  updateClientContact: (clientId: string, contact: { email?: string; phonePrefix?: string; phoneNumber?: string }) => Promise<void>;
  archiveClient: (clientId: string) => Promise<void>;
  restoreClient: (clientId: string) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  deleteAllClients: () => Promise<void>;
  setSelectedClient: (client: Client | null) => void;
  setShowArchived: (show: boolean) => void;
  bulkUpdateClients: (ids: string[], patch: Partial<Pick<Client, 'gender'>>) => Promise<void>;
  bulkArchiveClients: (ids: string[]) => Promise<void>;
  bulkRestoreClients: (ids: string[]) => Promise<void>;
  bulkDeleteClients: (ids: string[]) => Promise<void>;
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

  addClient: async (clientData, opts) => {
    const body: { client: Partial<Client>; createAccount?: boolean } = { client: clientData };
    if (opts?.createAccount === false) body.createAccount = false;
    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    const newClient = new Client(result.client);
    set((s) => ({ clients: [...s.clients, newClient] }));
    posthog.capture('client_created', {
      client_id: newClient.id,
      ...(opts?.source ? { source: opts.source } : {}),
    });
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

  bulkUpdateClients: async (ids, patch) => {
    const response = await fetch('/api/clients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bulk-update', ids, patch }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    set((s) => ({
      clients: s.clients.map((c) =>
        ids.includes(c.id) ? new Client({ ...c, ...patch } as Client) : c
      ),
    }));
  },

  bulkArchiveClients: async (ids) => {
    const response = await fetch('/api/clients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bulk-archive', ids }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    const archived_at = new Date().toISOString();
    set((s) => ({
      clients: s.clients.map((c) =>
        ids.includes(c.id) ? new Client({ ...c, archived_at } as Client) : c
      ),
    }));
  },

  bulkRestoreClients: async (ids) => {
    const response = await fetch('/api/clients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bulk-restore', ids }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    set((s) => ({
      clients: s.clients.map((c) =>
        ids.includes(c.id) ? new Client({ ...c, archived_at: null } as Client) : c
      ),
    }));
  },

  bulkDeleteClients: async (ids) => {
    const response = await fetch('/api/clients', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    set((s) => ({ clients: s.clients.filter((c) => !ids.includes(c.id)) }));
  },
}));
