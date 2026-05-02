import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Abbonamento } from '@/lib/types/Abbonamento';

interface AbbonamentiState {
  abbonamenti: Abbonamento[];
  isLoading: boolean;
  error: string | null;
  fetchAbbonamenti: () => Promise<void>;
  addAbbonamento: (abbonamento: Partial<Abbonamento>) => Promise<Abbonamento>;
  updateAbbonamento: (id: string, updated: Partial<Abbonamento>) => Promise<Abbonamento>;
  deleteAbbonamento: (id: string) => Promise<void>;
  deleteAllAbbonamenti: () => Promise<void>;
}

export const useAbbonamentiStore = create<AbbonamentiState>((set) => ({
  abbonamenti: [],
  isLoading: true,
  error: null,

  fetchAbbonamenti: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('abbonamenti').select('*');
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    set({ abbonamenti: data.map((a) => new Abbonamento(a)), isLoading: false, error: null });
  },

  addAbbonamento: async (abbonamento) => {
    const response = await fetch('/api/abbonamenti', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ abbonamento }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || "Impossibile creare l'abbonamento.");
    const created = new Abbonamento(result.abbonamento);
    set((s) => ({ abbonamenti: [...s.abbonamenti, created] }));
    return created;
  },

  updateAbbonamento: async (id, updated) => {
    const response = await fetch('/api/abbonamenti', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, abbonamento: updated }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || "Impossibile aggiornare l'abbonamento.");
    const next = new Abbonamento(result.abbonamento);
    set((s) => ({ abbonamenti: s.abbonamenti.map((a) => (a.id === id ? next : a)) }));
    return next;
  },

  deleteAbbonamento: async (id) => {
    const response = await fetch('/api/abbonamenti', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || "Impossibile eliminare l'abbonamento.");
    set((s) => ({ abbonamenti: s.abbonamenti.filter((a) => a.id !== id) }));
  },

  deleteAllAbbonamenti: async () => {
    const response = await fetch('/api/admin/delete-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'abbonamenti' }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    set({ abbonamenti: [] });
  },
}));
