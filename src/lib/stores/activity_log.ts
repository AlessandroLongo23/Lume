import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { ActivityLog } from '@/lib/types/ActivityLog';

// The log is append-only and grows without bound; the feed only ever needs the
// most recent slice. RLS scopes the rows to the caller's salon.
const FEED_LIMIT = 500;

interface ActivityLogState {
  activity_log: ActivityLog[];
  isLoading: boolean;
  error: string | null;
  fetchActivityLog: () => Promise<void>;
}

export const useActivityLogStore = create<ActivityLogState>((set) => ({
  activity_log: [],
  isLoading: false,
  error: null,

  fetchActivityLog: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(FEED_LIMIT);
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    set({
      activity_log: (data ?? []).map((a) => new ActivityLog(a)),
      isLoading: false,
      error: null,
    });
  },
}));
