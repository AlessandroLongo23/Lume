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
}));
