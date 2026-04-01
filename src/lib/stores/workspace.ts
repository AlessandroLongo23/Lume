import { create } from 'zustand';
import type { GatewayResult, WorkspaceContext } from '@/lib/types/Workspace';

interface WorkspaceState {
  isLoading:        boolean;
  businessContexts: WorkspaceContext[];
  clientContexts:   WorkspaceContext[];
  activeWorkspace:  'business' | 'client' | null;
  activeSalonId:    string | null;
  redirect:         GatewayResult['redirect'] | null;

  /** Fetch contexts from /api/gateway and update store. Returns the full result. */
  resolve:         () => Promise<GatewayResult>;
  /** POST to /api/gateway/set-salon and update activeSalonId in memory. */
  setActiveSalon:  (salonId: string) => Promise<void>;
  /** Set the in-memory workspace selection (business or client). */
  selectWorkspace: (type: 'business' | 'client') => void;
  reset:           () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  isLoading:        false,
  businessContexts: [],
  clientContexts:   [],
  activeWorkspace:  null,
  activeSalonId:    null,
  redirect:         null,

  resolve: async () => {
    set({ isLoading: true });
    const res    = await fetch('/api/gateway');
    const result = await res.json() as GatewayResult;
    set({
      isLoading:        false,
      businessContexts: result.businessContexts,
      clientContexts:   result.clientContexts,
      redirect:         result.redirect,
      activeSalonId:    result.activeSalonId ?? null,
    });
    // If a single unambiguous salon was determined, write the cookie immediately
    if (result.activeSalonId) {
      await fetch('/api/gateway/set-salon', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ salonId: result.activeSalonId }),
      });
    }
    return result;
  },

  setActiveSalon: async (salonId) => {
    await fetch('/api/gateway/set-salon', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ salonId }),
    });
    set({ activeSalonId: salonId });
  },

  selectWorkspace: (type) => set({ activeWorkspace: type }),

  reset: () => set({
    isLoading:        false,
    businessContexts: [],
    clientContexts:   [],
    activeWorkspace:  null,
    activeSalonId:    null,
    redirect:         null,
  }),
}));
