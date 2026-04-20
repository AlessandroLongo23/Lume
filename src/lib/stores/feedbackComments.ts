import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { FeedbackComment, type FeedbackCommentRow } from '@/lib/types/FeedbackComment';

interface FeedbackCommentsState {
  byFeedbackId: Record<string, FeedbackComment[]>;
  loadingIds: Set<string>;
  errorIds: Record<string, string>;
  fetch: (feedbackId: string) => Promise<void>;
  add: (feedbackId: string, data: { body: string; image_paths: string[] }) => Promise<FeedbackComment>;
  update: (id: string, patch: { body?: string; image_paths?: string[] }) => Promise<void>;
  remove: (id: string) => Promise<void>;
  subscribe: (feedbackId: string) => () => void;
}

function sortByCreatedAt(a: FeedbackComment, b: FeedbackComment): number {
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

async function fetchSingleCommentRow(id: string): Promise<FeedbackComment | null> {
  const { data, error } = await supabase
    .from('feedback_comments_with_author')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return new FeedbackComment(data as FeedbackCommentRow);
}

export const useFeedbackCommentsStore = create<FeedbackCommentsState>((set) => ({
  byFeedbackId: {},
  loadingIds: new Set<string>(),
  errorIds: {},

  fetch: async (feedbackId) => {
    set((s) => {
      const next = new Set(s.loadingIds);
      next.add(feedbackId);
      const errors = { ...s.errorIds };
      delete errors[feedbackId];
      return { loadingIds: next, errorIds: errors };
    });

    const { data, error } = await supabase
      .from('feedback_comments_with_author')
      .select('*')
      .eq('feedback_id', feedbackId)
      .order('created_at', { ascending: true });

    set((s) => {
      const next = new Set(s.loadingIds);
      next.delete(feedbackId);
      if (error) {
        return {
          loadingIds: next,
          errorIds: { ...s.errorIds, [feedbackId]: error.message },
        };
      }
      const list = (data as FeedbackCommentRow[]).map((r) => new FeedbackComment(r));
      return {
        loadingIds: next,
        byFeedbackId: { ...s.byFeedbackId, [feedbackId]: list },
      };
    });
  },

  add: async (feedbackId, data) => {
    const res = await fetch('/api/feedback/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback_id: feedbackId, ...data }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error ?? 'Errore sconosciuto');
    const comment = new FeedbackComment(result.comment);

    set((s) => {
      const existing = s.byFeedbackId[feedbackId] ?? [];
      const alreadyThere = existing.some((c) => c.id === comment.id);
      const merged = alreadyThere ? existing : [...existing, comment].sort(sortByCreatedAt);
      return { byFeedbackId: { ...s.byFeedbackId, [feedbackId]: merged } };
    });

    return comment;
  },

  update: async (id, patch) => {
    const res = await fetch('/api/feedback/comments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error ?? 'Errore sconosciuto');

    const updated = new FeedbackComment(result.comment);
    set((s) => {
      const feedbackId = updated.feedback_id;
      const list = s.byFeedbackId[feedbackId] ?? [];
      const next = list.map((c) => (c.id === updated.id ? updated : c));
      return { byFeedbackId: { ...s.byFeedbackId, [feedbackId]: next } };
    });
  },

  remove: async (id) => {
    const res = await fetch('/api/feedback/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error ?? 'Errore sconosciuto');

    set((s) => {
      const next: Record<string, FeedbackComment[]> = {};
      for (const [fid, list] of Object.entries(s.byFeedbackId)) {
        next[fid] = list.filter((c) => c.id !== id);
      }
      return { byFeedbackId: next };
    });
  },

  subscribe: (feedbackId) => {
    const channel = supabase
      .channel(`feedback_comments_${feedbackId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feedback_comments', filter: `feedback_id=eq.${feedbackId}` },
        async (payload) => {
          const row = payload.new as { id: string };
          const comment = await fetchSingleCommentRow(row.id);
          if (!comment) return;
          set((s) => {
            const existing = s.byFeedbackId[feedbackId] ?? [];
            if (existing.some((c) => c.id === comment.id)) return s;
            return {
              byFeedbackId: {
                ...s.byFeedbackId,
                [feedbackId]: [...existing, comment].sort(sortByCreatedAt),
              },
            };
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'feedback_comments', filter: `feedback_id=eq.${feedbackId}` },
        async (payload) => {
          const row = payload.new as { id: string };
          const comment = await fetchSingleCommentRow(row.id);
          if (!comment) return;
          set((s) => {
            const existing = s.byFeedbackId[feedbackId] ?? [];
            const next = existing.map((c) => (c.id === comment.id ? comment : c));
            return { byFeedbackId: { ...s.byFeedbackId, [feedbackId]: next } };
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'feedback_comments', filter: `feedback_id=eq.${feedbackId}` },
        (payload) => {
          const row = payload.old as { id: string };
          set((s) => {
            const existing = s.byFeedbackId[feedbackId] ?? [];
            const next = existing.filter((c) => c.id !== row.id);
            return { byFeedbackId: { ...s.byFeedbackId, [feedbackId]: next } };
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
