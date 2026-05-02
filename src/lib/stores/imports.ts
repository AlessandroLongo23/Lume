import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import type { ImportJob } from '@/lib/types/ImportJob';

interface ImportsState {
  jobs: ImportJob[];
  current: ImportJob | null;
  isLoading: boolean;
  error: string | null;
  fetchJob: (jobId: string) => Promise<void>;
  setCurrent: (job: ImportJob | null) => void;
}

export const useImportsStore = create<ImportsState>((set) => ({
  jobs: [],
  current: null,
  isLoading: false,
  error: null,

  fetchJob: async (jobId) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    const job = (data ?? null) as ImportJob | null;
    set({ current: job, isLoading: false });
  },

  setCurrent: (job) => set({ current: job }),
}));
