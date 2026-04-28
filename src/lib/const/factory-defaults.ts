import type { Theme, Density, SidebarDefault, ClientiView, FichesView, OrdiniView, CalendarioView } from '@/lib/types/Preferences';
import type { SalonFormDefaults } from '@/lib/types/Salon';

/**
 * Factory defaults used when a profile has no explicit preference set, and
 * powers each panel's "Ripristina default" link.
 */
export const FACTORY_PREFERENCES = {
  appearance: {
    theme: 'system' as Theme,
    density: 'comfortable' as Density,
    sidebarDefault: 'open' as SidebarDefault,
  },
  defaultViews: {
    clienti: 'table' as ClientiView,
    fiches: 'table' as FichesView,
    ordini: 'table' as OrdiniView,
    calendario: 'day' as CalendarioView,
  },
  calendar: {
    weekStartsOn: 1 as 0 | 1,
  },
  notifications: {
    lowStock: true,
    noShow: true,
    newBooking: true,
    dailyDigest: false,
  },
} as const;

/**
 * Factory salon-wide form defaults. Used by the `useFormDefaults()` hook when
 * a salon hasn't customized a value yet, and by the "Ripristina default" link
 * in the Default form settings panel.
 */
export const FACTORY_FORM_DEFAULTS: Required<SalonFormDefaults> = {
  service_duration_min: 30,
  gift_card_validity_months: 12,
  gift_coupon_validity_months: 12,
  gift_coupon_discount_type: 'fixed',
  abbonamento_treatments: 5,
  abbonamento_discount_percent: 10,
  abbonamento_payment_method: 'cash',
  client_phone_prefix: '+39',
  client_default_gender: 'M',
};

export const FACTORY_SALON_NUMERIC = {
  slot_granularity_min: 15,
  default_appointment_duration_min: 30,
  default_low_stock_threshold: 0,
} as const;
