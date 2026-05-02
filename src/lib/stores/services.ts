import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Service } from '@/lib/types/Service';

interface ServicesState {
  services: Service[];
  showArchived: boolean;
  isLoading: boolean;
  error: string | null;
  fetchServices: () => Promise<void>;
  addService: (service: Partial<Service>) => Promise<Service>;
  updateService: (id: string, updated: Partial<Service>) => Promise<Service>;
  archiveService: (id: string) => Promise<void>;
  restoreService: (id: string) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  deleteAllServices: () => Promise<void>;
  setShowArchived: (show: boolean) => void;
}

export const useServicesStore = create<ServicesState>((set) => ({
  services: [],
  showArchived: false,
  isLoading: true,
  error: null,

  fetchServices: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('services').select('*');
    if (error) { set({ isLoading: false, error: error.message }); return; }
    set({ services: data.map((s) => new Service(s)), isLoading: false, error: null });
  },

  addService: async (service) => {
    const response = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return new Service(result.service);
  },

  updateService: async (id, updated) => {
    const response = await fetch('/api/services', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, service: updated }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return new Service(result.service);
  },

  archiveService: async (id) => {
    const response = await fetch('/api/services', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'archive' }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  restoreService: async (id) => {
    const response = await fetch('/api/services', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'restore' }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  deleteService: async (id) => {
    const response = await fetch('/api/services', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  deleteAllServices: async () => {
    const response = await fetch('/api/admin/delete-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'services' }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    set({ services: [] });
  },

  setShowArchived: (show) => set({ showArchived: show }),
}));
