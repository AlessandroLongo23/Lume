import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { FeedbackEntry, type FeedbackEntryRow, type FeedbackStatus, type FeedbackType } from '@/lib/types/FeedbackEntry';

export type FeedbackFilter = 'all' | 'open' | 'in_progress' | 'completed';
export type FeedbackTypeFilter = 'all' | FeedbackType;
export type FeedbackSort = 'top' | 'recent';

interface FeedbackState {
  entries: FeedbackEntry[];
  myUpvoteIds: Set<string>;
  isLoading: boolean;
  error: string | null;
  filter: FeedbackFilter;
  typeFilter: FeedbackTypeFilter;
  sort: FeedbackSort;
  mineOnly: boolean;
  fetchEntries: () => Promise<void>;
  addEntry: (data: { type: FeedbackType; title: string; description: string; image_paths?: string[] }) => Promise<FeedbackEntry>;
  updateEntry: (id: string, patch: { status?: FeedbackStatus; title?: string; description?: string; image_paths?: string[] }) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  toggleUpvote: (id: string) => Promise<void>;
  setFilter: (f: FeedbackFilter) => void;
  setTypeFilter: (t: FeedbackTypeFilter) => void;
  setSort: (s: FeedbackSort) => void;
  setMineOnly: (b: boolean) => void;
  getById: (id: string) => FeedbackEntry | null;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  entries: [],
  myUpvoteIds: new Set<string>(),
  isLoading: true,
  error: null,
  filter: 'open',
  typeFilter: 'all',
  sort: 'top',
  mineOnly: false,

  fetchEntries: async () => {
    set((s) => ({ ...s, isLoading: true }));

    const [entriesRes, userRes] = await Promise.all([
      supabase.from('feedback_entries_with_counts').select('*'),
      supabase.auth.getUser(),
    ]);

    if (entriesRes.error) {
      set({ isLoading: false, error: entriesRes.error.message });
      return;
    }

    const userId = userRes.data.user?.id;
    let myUpvoteIds = new Set<string>();

    if (userId) {
      const { data: upvotes } = await supabase
        .from('feedback_upvotes')
        .select('feedback_id')
        .eq('user_id', userId);
      if (upvotes) {
        myUpvoteIds = new Set(upvotes.map((u: { feedback_id: string }) => u.feedback_id));
      }
    }

    set({
      entries: (entriesRes.data as FeedbackEntryRow[]).map((r) => new FeedbackEntry(r)),
      myUpvoteIds,
      isLoading: false,
      error: null,
    });
  },

  addEntry: async (data) => {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error ?? 'Errore sconosciuto');
    const entry = new FeedbackEntry(result.entry);
    set((s) => ({ entries: [entry, ...s.entries] }));
    return entry;
  },

  updateEntry: async (id, patch) => {
    const res = await fetch('/api/feedback', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error ?? 'Errore sconosciuto');
  },

  deleteEntry: async (id) => {
    const res = await fetch('/api/feedback', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error ?? 'Errore sconosciuto');
  },

  toggleUpvote: async (id) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non autenticato');

    const current = get().myUpvoteIds;
    const hasVoted = current.has(id);

    const nextUpvotes = new Set(current);
    if (hasVoted) nextUpvotes.delete(id);
    else nextUpvotes.add(id);

    set((s) => ({
      myUpvoteIds: nextUpvotes,
      entries: s.entries.map((e) =>
        e.id === id
          ? new FeedbackEntry({ ...e, upvote_count: e.upvote_count + (hasVoted ? -1 : 1) })
          : e,
      ),
    }));

    const { error } = hasVoted
      ? await supabase.from('feedback_upvotes').delete().eq('feedback_id', id).eq('user_id', user.id)
      : await supabase.from('feedback_upvotes').insert({ feedback_id: id, user_id: user.id });

    if (error) {
      set((s) => ({
        myUpvoteIds: current,
        entries: s.entries.map((e) =>
          e.id === id
            ? new FeedbackEntry({ ...e, upvote_count: e.upvote_count + (hasVoted ? 1 : -1) })
            : e,
        ),
      }));
      throw new Error(error.message);
    }
  },

  setFilter: (f) => set({ filter: f }),
  setTypeFilter: (t) => set({ typeFilter: t }),
  setSort: (s) => set({ sort: s }),
  setMineOnly: (b) => set({ mineOnly: b }),

  getById: (id) => get().entries.find((e) => e.id === id) ?? null,
}));
