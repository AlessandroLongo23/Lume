import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { useWorkspaceStore } from '@/lib/stores/workspace';

export interface OperatorService {
  id: string;
  salon_id: string;
  service_id: string;
  operator_id: string;
}

interface OperatorServicesState {
  items: OperatorService[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  /** Returns true when (service, operator) is in the eligibility map.
   *  Per the spec: an empty set for a given service means everyone can
   *  perform it, so callers must combine `isEligible` with a "service has
   *  any rule at all" check when rendering the matrix. */
  isEligible: (serviceId: string, operatorId: string) => boolean;
  setEligibility: (serviceId: string, operatorId: string, allowed: boolean) => Promise<void>;
  /** Replace the eligibility set for a service with `operatorIds`. Empty array
   *  collapses the service back to "chiunque" (no rows). */
  replaceForService: (serviceId: string, operatorIds: string[]) => Promise<void>;
}

export const useOperatorServicesStore = create<OperatorServicesState>((set, get) => ({
  items: [],
  isLoading: true,
  isLoaded: false,
  error: null,

  fetchItems: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('operator_services').select('*');
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    set({ items: (data ?? []) as OperatorService[], isLoading: false, isLoaded: true, error: null });
  },

  isEligible: (serviceId, operatorId) =>
    get().items.some((it) => it.service_id === serviceId && it.operator_id === operatorId),

  setEligibility: async (serviceId, operatorId, allowed) => {
    const state = get();
    const existing = state.items.find((it) => it.service_id === serviceId && it.operator_id === operatorId);
    if (allowed) {
      if (existing) return;
      const activeSalonId = useWorkspaceStore.getState().activeSalonId;
      if (!activeSalonId) throw new Error('Nessun salone attivo selezionato.');
      const { data, error } = await supabase
        .from('operator_services')
        .insert([{ salon_id: activeSalonId, service_id: serviceId, operator_id: operatorId }])
        .select()
        .single();
      if (error) throw new Error(error.message || 'Impossibile aggiornare l\'abilitazione.');
      set((s) => ({ items: [...s.items, data as OperatorService] }));
    } else {
      if (!existing) return;
      const { error } = await supabase.from('operator_services').delete().eq('id', existing.id);
      if (error) throw new Error(error.message || 'Impossibile aggiornare l\'abilitazione.');
      set((s) => ({ items: s.items.filter((it) => it.id !== existing.id) }));
    }
  },

  replaceForService: async (serviceId, operatorIds) => {
    const state = get();
    const existing = state.items.filter((it) => it.service_id === serviceId);
    const desired = new Set(operatorIds);
    const existingIds = new Set(existing.map((it) => it.operator_id));

    const toRemove = existing.filter((it) => !desired.has(it.operator_id));
    const toAdd = operatorIds.filter((id) => !existingIds.has(id));

    if (toRemove.length === 0 && toAdd.length === 0) return;

    if (toRemove.length > 0) {
      const ids = toRemove.map((it) => it.id);
      const { error } = await supabase.from('operator_services').delete().in('id', ids);
      if (error) throw new Error(error.message || 'Impossibile aggiornare l\'abilitazione.');
    }

    let inserted: OperatorService[] = [];
    if (toAdd.length > 0) {
      const activeSalonId = useWorkspaceStore.getState().activeSalonId;
      if (!activeSalonId) throw new Error('Nessun salone attivo selezionato.');
      const rows = toAdd.map((operator_id) => ({
        salon_id: activeSalonId,
        service_id: serviceId,
        operator_id,
      }));
      const { data, error } = await supabase.from('operator_services').insert(rows).select();
      if (error) throw new Error(error.message || 'Impossibile aggiornare l\'abilitazione.');
      inserted = (data ?? []) as OperatorService[];
    }

    const removedIds = new Set(toRemove.map((it) => it.id));
    set((s) => ({ items: [...s.items.filter((it) => !removedIds.has(it.id)), ...inserted] }));
  },
}));
