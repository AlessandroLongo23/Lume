import { create } from 'zustand';
import type { ProfilePreferences } from '@/lib/types/Preferences';

interface PreferencesState {
  isLoading: boolean;
  isLoaded: boolean;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  phonePrefix: string;
  phoneNumber: string;
  preferences: ProfilePreferences;
  fetchPreferences: () => Promise<void>;
  /**
   * Optimistically merge a preferences patch and PATCH the server.
   * Reverts on error.
   */
  updatePreferences: (patch: ProfilePreferences) => Promise<void>;
  /**
   * Update profile-level fields. The server mirrors these onto the linked
   * operator row so the operator card stays in sync with the account.
   */
  updateProfile: (patch: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string | null;
    phone_prefix?: string | null;
    phone_number?: string | null;
  }) => Promise<void>;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function deepMerge<T extends Record<string, unknown>>(base: T, patch: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (isPlainObject(v) && isPlainObject(out[k])) {
      out[k] = deepMerge(out[k] as Record<string, unknown>, v);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  isLoading: true,
  isLoaded: false,
  firstName: '',
  lastName: '',
  email: '',
  avatarUrl: null,
  phonePrefix: '+39',
  phoneNumber: '',
  preferences: {},

  fetchPreferences: async () => {
    try {
      const res = await fetch('/api/preferences');
      if (!res.ok) {
        set({ isLoading: false });
        return;
      }
      const data = await res.json();
      set({
        isLoading: false,
        isLoaded: true,
        firstName: data.first_name ?? '',
        lastName: data.last_name ?? '',
        email: data.email ?? '',
        avatarUrl: data.avatar_url ?? null,
        phonePrefix: data.phone_prefix ?? '+39',
        phoneNumber: data.phone_number ?? '',
        preferences: data.preferences ?? {},
      });
    } catch {
      set({ isLoading: false });
    }
  },

  updatePreferences: async (patch) => {
    const previous = get().preferences;
    const optimistic = deepMerge(previous as Record<string, unknown>, patch as Record<string, unknown>) as ProfilePreferences;
    set({ preferences: optimistic });
    try {
      const res = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: patch }),
      });
      if (!res.ok) throw new Error('PATCH failed');
    } catch (err) {
      set({ preferences: previous });
      throw err;
    }
  },

  updateProfile: async (patch) => {
    const previous = {
      firstName: get().firstName,
      lastName: get().lastName,
      avatarUrl: get().avatarUrl,
      phonePrefix: get().phonePrefix,
      phoneNumber: get().phoneNumber,
    };
    set({
      firstName: patch.first_name ?? previous.firstName,
      lastName: patch.last_name ?? previous.lastName,
      avatarUrl: patch.avatar_url === undefined ? previous.avatarUrl : patch.avatar_url,
      phonePrefix: patch.phone_prefix === undefined ? previous.phonePrefix : (patch.phone_prefix ?? '+39'),
      phoneNumber: patch.phone_number === undefined ? previous.phoneNumber : (patch.phone_number ?? ''),
    });
    try {
      const res = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('PATCH failed');
    } catch (err) {
      set(previous);
      throw err;
    }
  },
}));
