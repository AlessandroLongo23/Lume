import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { useWorkspaceStore } from '@/lib/stores/workspace';

// Sub-project C: salon-level closures (holidays, ferie d'agosto,
// refurbishment, etc). RLS scopes everything to the active salon and
// gates writes on role='owner' — see
// supabase/migrations/2026_05_16_04_salon_closures.sql.

export type SalonClosure = {
  id: string;
  salon_id: string;
  starts_on: string; // YYYY-MM-DD
  ends_on: string;   // YYYY-MM-DD (inclusive)
  note: string | null;
  created_at: string;
};

interface SalonClosuresState {
  items: SalonClosure[];
  isLoading: boolean;
  error: string | null;
  fetchClosures: () => Promise<void>;
  addClosure: (input: { starts_on: string; ends_on: string; note: string | null }) => Promise<SalonClosure>;
  updateClosure: (
    id: string,
    patch: Partial<{ starts_on: string; ends_on: string; note: string | null }>,
  ) => Promise<SalonClosure>;
  removeClosure: (id: string) => Promise<void>;
}

export const useSalonClosuresStore = create<SalonClosuresState>((set) => ({
  items: [],
  isLoading: true,
  error: null,

  fetchClosures: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase
      .from('salon_closures')
      .select('*')
      .order('starts_on', { ascending: true });
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    set({ items: (data ?? []) as SalonClosure[], isLoading: false, error: null });
  },

  addClosure: async (input) => {
    const activeSalonId = useWorkspaceStore.getState().activeSalonId;
    if (!activeSalonId) throw new Error('Nessun salone attivo selezionato.');
    const { data, error } = await supabase
      .from('salon_closures')
      .insert([
        {
          salon_id: activeSalonId,
          starts_on: input.starts_on,
          ends_on: input.ends_on,
          note: input.note,
        },
      ])
      .select()
      .single();
    if (error) throw new Error(error.message || 'Impossibile creare la chiusura.');
    const created = data as SalonClosure;
    set((s) => ({ items: [...s.items, created].sort((a, b) => a.starts_on.localeCompare(b.starts_on)) }));
    return created;
  },

  updateClosure: async (id, patch) => {
    const { data, error } = await supabase
      .from('salon_closures')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message || 'Impossibile aggiornare la chiusura.');
    const updated = data as SalonClosure;
    set((s) => ({
      items: s.items
        .map((it) => (it.id === id ? updated : it))
        .sort((a, b) => a.starts_on.localeCompare(b.starts_on)),
    }));
    return updated;
  },

  removeClosure: async (id) => {
    const { error } = await supabase.from('salon_closures').delete().eq('id', id);
    if (error) throw new Error(error.message || 'Impossibile eliminare la chiusura.');
    set((s) => ({ items: s.items.filter((it) => it.id !== id) }));
  },
}));
