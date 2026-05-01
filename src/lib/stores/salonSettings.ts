import { create } from 'zustand';
import type { BusinessType, SalonFiscal, SalonFormDefaults, SalonEmailNotifications } from '@/lib/types/Salon';

export interface OperatingHourShift {
  start: string;
  end: string;
}

export interface OperatingHourDay {
  day: number;
  isOpen: boolean;
  shifts: OperatingHourShift[];
}

export interface SalonSettings {
  name: string;
  type: BusinessType | null;
  operating_hours: OperatingHourDay[];
  track_inventory: boolean;
  address: string | null;
  city: string | null;
  cap: string | null;
  province: string | null;
  phone: string | null;
  public_email: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  brand_color: string | null;
  fiscal: SalonFiscal;
  // M4 additions
  slot_granularity_min: number;
  default_appointment_duration_min: number;
  default_low_stock_threshold: number;
  form_defaults: SalonFormDefaults;
  // M5 additions
  email_notifications: SalonEmailNotifications;
  /** When true, operators can create/edit/delete their own unavailabilities. */
  allow_operator_self_unavailability: boolean;
}

interface SalonSettingsState {
  isLoading: boolean;
  isLoaded: boolean;
  settings: SalonSettings | null;
  fetchSettings: () => Promise<void>;
  /** PATCH /api/settings with the given fields and merge into local state. */
  updateSettings: (patch: Partial<SalonSettings>) => Promise<void>;
  /** Apply server-side changes (e.g. branding upload) into local state. */
  applyLocal: (patch: Partial<SalonSettings>) => void;
}

const EMPTY: SalonSettings = {
  name: '',
  type: null,
  operating_hours: [],
  track_inventory: false,
  address: null,
  city: null,
  cap: null,
  province: null,
  phone: null,
  public_email: null,
  logo_url: null,
  favicon_url: null,
  brand_color: null,
  fiscal: {},
  slot_granularity_min: 15,
  default_appointment_duration_min: 30,
  default_low_stock_threshold: 0,
  form_defaults: {},
  email_notifications: {},
  allow_operator_self_unavailability: false,
};

export const useSalonSettingsStore = create<SalonSettingsState>((set, get) => ({
  isLoading: true,
  isLoaded: false,
  settings: null,

  fetchSettings: async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) {
        set({ isLoading: false });
        return;
      }
      const data = (await res.json()) as Partial<SalonSettings>;
      set({
        isLoading: false,
        isLoaded: true,
        settings: {
          ...EMPTY,
          ...data,
          fiscal: data.fiscal ?? {},
          form_defaults: data.form_defaults ?? {},
          email_notifications: data.email_notifications ?? {},
        },
      });
    } catch {
      set({ isLoading: false });
    }
  },

  updateSettings: async (patch) => {
    const previous = get().settings;
    if (previous) {
      set({
        settings: {
          ...previous,
          ...patch,
          fiscal: { ...previous.fiscal, ...(patch.fiscal ?? {}) },
          form_defaults: { ...previous.form_defaults, ...(patch.form_defaults ?? {}) },
          email_notifications: { ...previous.email_notifications, ...(patch.email_notifications ?? {}) },
        },
      });
    }
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (err) {
      if (previous) set({ settings: previous });
      throw err;
    }
  },

  applyLocal: (patch) => {
    const previous = get().settings;
    if (!previous) return;
    set({
      settings: {
        ...previous,
        ...patch,
        fiscal: { ...previous.fiscal, ...(patch.fiscal ?? {}) },
        form_defaults: { ...previous.form_defaults, ...(patch.form_defaults ?? {}) },
        email_notifications: { ...previous.email_notifications, ...(patch.email_notifications ?? {}) },
      },
    });
  },
}));
