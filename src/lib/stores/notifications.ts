import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import type { Notification } from '@/lib/types/Notification';

const RECENT_LIMIT = 50;

interface NotificationsState {
  notifications: Notification[];
  isLoading: boolean;
  isLoaded: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  /** Returns the current count of unread items — convenience selector. */
  unreadCount: () => number;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  isLoading: false,
  isLoaded: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    // RLS scopes this to the caller's own rows in the active salon.
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(RECENT_LIMIT);
    if (error) {
      console.error('fetchNotifications failed:', error);
      set({ isLoading: false });
      return;
    }
    set({ notifications: (data ?? []) as Notification[], isLoading: false, isLoaded: true });
  },

  markAsRead: async (id) => {
    const now = new Date().toISOString();
    // Optimistic — RLS lets the user update only their own row.
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read_at: n.read_at ?? now } : n,
      ),
    }));
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('id', id)
      .is('read_at', null);
    if (error) console.error('markAsRead failed:', error);
  },

  markAllAsRead: async () => {
    const now = new Date().toISOString();
    const unreadIds = get().notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0) return;
    set((s) => ({
      notifications: s.notifications.map((n) => (n.read_at ? n : { ...n, read_at: now })),
    }));
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .in('id', unreadIds);
    if (error) console.error('markAllAsRead failed:', error);
  },

  remove: async (id) => {
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) console.error('remove notification failed:', error);
  },

  unreadCount: () => get().notifications.filter((n) => !n.read_at).length,
}));
