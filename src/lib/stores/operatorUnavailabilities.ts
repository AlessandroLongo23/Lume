import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { OperatorUnavailability } from '@/lib/types/OperatorUnavailability';
import { useWorkspaceStore } from '@/lib/stores/workspace';

interface OperatorUnavailabilitiesState {
  items: OperatorUnavailability[];
  isLoading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  add: (
    input: {
      operator_id: string;
      start_at: Date;
      end_at: Date;
      all_day?: boolean;
      note?: string | null;
    },
  ) => Promise<OperatorUnavailability>;
  update: (
    id: string,
    patch: Partial<{
      start_at: Date;
      end_at: Date;
      all_day: boolean;
      note: string | null;
    }>,
  ) => Promise<OperatorUnavailability>;
  remove: (id: string) => Promise<void>;
}

export const useOperatorUnavailabilitiesStore = create<OperatorUnavailabilitiesState>((set) => ({
  items: [],
  isLoading: true,
  error: null,

  fetchItems: async () => {
    set((s) => ({ ...s, isLoading: true }));
    // Pull a generous window — vacations can span months. Keep a 1-year past
    // floor so the calendar never shows torn data when navigating backward.
    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);
    const { data, error } = await supabase
      .from('operator_unavailabilities')
      .select('*')
      .gte('end_at', since.toISOString());
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    set({
      items: (data ?? []).map((row) => new OperatorUnavailability(row)),
      isLoading: false,
      error: null,
    });
  },

  add: async (input) => {
    const activeSalonId = useWorkspaceStore.getState().activeSalonId;
    if (!activeSalonId) throw new Error('Nessun salone attivo selezionato.');
    const { data, error } = await supabase
      .from('operator_unavailabilities')
      .insert([
        {
          salon_id: activeSalonId,
          operator_id: input.operator_id,
          start_at: input.start_at.toISOString(),
          end_at: input.end_at.toISOString(),
          all_day: input.all_day ?? false,
          note: input.note ?? null,
        },
      ])
      .select()
      .single();
    if (error) throw new Error(error.message || 'Impossibile creare la non disponibilità.');
    const item = new OperatorUnavailability(data);
    set((s) => ({ items: [...s.items, item] }));
    return item;
  },

  update: async (id, patch) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.start_at) dbPatch.start_at = patch.start_at.toISOString();
    if (patch.end_at) dbPatch.end_at = patch.end_at.toISOString();
    if (patch.all_day !== undefined) dbPatch.all_day = patch.all_day;
    if (patch.note !== undefined) dbPatch.note = patch.note;

    const { data, error } = await supabase
      .from('operator_unavailabilities')
      .update(dbPatch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message || 'Impossibile aggiornare la non disponibilità.');
    const updated = new OperatorUnavailability(data);
    set((s) => ({ items: s.items.map((it) => (it.id === id ? updated : it)) }));
    return updated;
  },

  remove: async (id) => {
    const { error } = await supabase.from('operator_unavailabilities').delete().eq('id', id);
    if (error) throw new Error(error.message || 'Impossibile eliminare la non disponibilità.');
    set((s) => ({ items: s.items.filter((it) => it.id !== id) }));
  },
}));
