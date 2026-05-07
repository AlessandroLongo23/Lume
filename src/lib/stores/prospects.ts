import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Prospect, type ProspectRow, type ProspectStatus } from '@/lib/types/Prospect';

export type ProspectInput = {
  name:             string;
  phone_shop?:      string | null;
  phone_personal?:  string | null;
  owner_name?:      string | null;
  google_maps_url?: string | null;
  comune_code?:     string | null;
  city?:            string | null;
  province?:        string | null;
  region?:          string | null;
  address?:         string | null;
  current_software?: string | null;
  notes?:           string | null;
};

export type ProspectUpdate = Partial<ProspectInput> & {
  status?:       ProspectStatus;
  callback_at?:  string | null;
};

interface ProspectsState {
  prospects: Prospect[];
  isLoading: boolean;
  error:     string | null;
  selected:  Prospect | null;
  fetch:     () => Promise<void>;
  add:       (input: ProspectInput) => Promise<Prospect>;
  update:    (id: string, patch: ProspectUpdate) => Promise<Prospect>;
  remove:    (id: string) => Promise<void>;
  setSelected: (p: Prospect | null) => void;
}

export const useProspectsStore = create<ProspectsState>((set) => ({
  prospects: [],
  isLoading: true,
  error:     null,
  selected:  null,

  fetch: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase
      .from('prospects')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<ProspectRow[]>();
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    set({
      prospects: (data ?? []).map((row) => new Prospect(row)),
      isLoading: false,
      error:     null,
    });
  },

  add: async (input) => {
    const res = await fetch('/api/platform/prospects', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(input),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error ?? 'Errore di rete');
    const created = new Prospect(body.prospect as ProspectRow);
    set((s) => ({ prospects: [created, ...s.prospects] }));
    return created;
  },

  update: async (id, patch) => {
    const res = await fetch(`/api/platform/prospects/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(patch),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error ?? 'Errore di rete');
    const updated = new Prospect(body.prospect as ProspectRow);
    set((s) => ({
      prospects: s.prospects.map((p) => (p.id === id ? updated : p)),
      selected:  s.selected?.id === id ? updated : s.selected,
    }));
    return updated;
  },

  remove: async (id) => {
    const res = await fetch(`/api/platform/prospects/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error ?? 'Errore di rete');
    }
    set((s) => ({
      prospects: s.prospects.filter((p) => p.id !== id),
      selected:  s.selected?.id === id ? null : s.selected,
    }));
  },

  setSelected: (p) => set({ selected: p }),
}));

// Convenience: get the current prospects list outside React
export function getProspectsSnapshot(): Prospect[] {
  return useProspectsStore.getState().prospects;
}
