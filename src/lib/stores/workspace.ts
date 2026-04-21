import { create } from 'zustand';
import type { GatewayResult, WorkspaceContext } from '@/lib/types/Workspace';

interface WorkspaceState {
  isLoading:        boolean;
  businessContexts: WorkspaceContext[];
  clientContexts:   WorkspaceContext[];
  activeWorkspace:  'business' | 'client' | null;
  activeSalonId:    string | null;
  redirect:         GatewayResult['redirect'] | null;
  isAdmin:          boolean;

  /** Fetch contexts from /api/gateway and update store. Returns the full result. */
  resolve:         () => Promise<GatewayResult>;
  /** POST to set/impersonate the active salon; branches on isAdmin. */
  setActiveSalon:  (salonId: string) => Promise<void>;
  /** Set the in-memory workspace selection (business or client). */
  selectWorkspace: (type: 'business' | 'client') => void;
  reset:           () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  isLoading:        false,
  businessContexts: [],
  clientContexts:   [],
  activeWorkspace:  null,
  activeSalonId:    null,
  redirect:         null,
  isAdmin:          false,

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
      isAdmin:          result.isAdmin ?? false,
    });
    // Non-admin multi-salon users persist their choice here. For admins the
    // gateway itself resyncs the cookie from the super_admin_impersonation
    // table, so this POST would 403 and is redundant.
    if (result.activeSalonId && !result.isAdmin) {
      await fetch('/api/gateway/set-salon', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ salonId: result.activeSalonId }),
      });
    }
    return result;
  },

  setActiveSalon: async (salonId) => {
    // Admins impersonate via /api/platform/enter-salon, which also writes the
    // super_admin_impersonation row. /api/gateway/set-salon 403s for admins.
    const endpoint = get().isAdmin ? '/api/platform/enter-salon' : '/api/gateway/set-salon';
    await fetch(endpoint, {
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
    isAdmin:          false,
  }),
}));
