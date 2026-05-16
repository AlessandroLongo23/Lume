export type BusinessType = 'barber' | 'hair_salon' | 'beauty_center' | 'nails' | 'other';
export type OriginType = 'word_of_mouth' | 'social_media' | 'google' | 'event';
export type RegimeFiscale = 'forfettario' | 'ordinario';

export interface SalonFiscal {
  ragione_sociale?: string;
  p_iva?: string;
  codice_fiscale?: string;
  regime?: RegimeFiscale;
  sdi?: string;
  pec?: string;
  default_iva_pct?: number;
}

export interface SalonEmailNotifications {
  sender_name?: string;
  reply_to?: string;
  appointment_reminder?: { enabled: boolean; hours_before: number };
  birthday_wishes?: { enabled: boolean };
  fiche_by_email?: { enabled: boolean };
}

/** Online booking access policy.
 *  - 'public'        — anyone with the link can book.
 *  - 'clients_only'  — only existing clients (matched by phone / email).
 *  - 'selected'      — only clients whose `can_book_online = true`. */
export type BookingAccessMode = 'public' | 'clients_only' | 'selected';

/** When approval is required, who gets the approval ping. */
export type BookingApprovalScope = 'chosen_operator' | 'any_staff';

/** Stored as `salons.booking_config` JSONB. All keys optional — the app
 *  fills missing keys with the defaults documented in the migration. */
export interface BookingConfig {
  access_mode?:             BookingAccessMode;
  allow_operator_choice?:   boolean;
  require_approval?:        boolean;
  approval_scope?:          BookingApprovalScope;
  /** Minimum minutes between "now" and the chosen slot. Default 120. */
  min_lead_minutes?:        number;
  /** Furthest into the future a client may book. Default 60. */
  max_lead_days?:           number;
  /** How close to the appointment a client can still self-cancel. Default 24. */
  cancel_window_hours?:     number;
  /** Symmetric padding around every booking. Default 0. */
  buffer_between_minutes?:  number;
  /** When true, the public form forces an email in addition to phone. */
  guest_email_required?:    boolean;
  /** Free-form Italian text shown on the public booking page. */
  public_message?:          string | null;
}

export interface SalonFormDefaults {
  service_duration_min?: number;
  gift_card_validity_months?: number;
  gift_coupon_validity_months?: number;
  gift_coupon_discount_type?: 'fixed' | 'percent' | 'free_item';
  abbonamento_treatments?: number;
  abbonamento_discount_percent?: number;
  abbonamento_payment_method?: 'cash' | 'card' | 'transfer';
  client_phone_prefix?: string;
  client_default_gender?: 'M' | 'F';
}

export interface Salon {
  id:                      string;
  name:                    string;
  type:                    BusinessType;
  origin:                  OriginType;
  invite_code:             string | null;
  owner_id:                string;
  trial_ends_at:           string;
  created_at:              string;
  stripe_customer_id:      string | null;
  stripe_subscription_id:  string | null;
  subscription_status:     string;
  subscription_plan:       string | null;
  subscription_ends_at:    string | null;
  referral_code:           string;
  referred_by_salon_id:    string | null;
  logo_url:                string | null;
  track_inventory:         boolean;
  // M3 additions
  address:                 string | null;
  city:                    string | null;
  cap:                     string | null;
  province:                string | null;
  phone:                   string | null;
  public_email:            string | null;
  favicon_url:             string | null;
  brand_color:             string | null;
  fiscal:                  SalonFiscal;
  // M4 additions
  slot_granularity_min:    number;
  default_appointment_duration_min: number;
  default_low_stock_threshold: number;
  form_defaults:           SalonFormDefaults;
  // M5 additions
  email_notifications:     SalonEmailNotifications;
  // Onboarding bulk import
  onboarded_at:            string | null;
  onboarding_dismissed_at: string | null;
  // Platform
  is_test:                 boolean;
  // Online booking (sub-project A)
  /** Public-URL handle. NULL until the owner picks one. */
  slug:                    string | null;
  /** Master toggle for the `lume.app/<slug>` public app. */
  booking_enabled:         boolean;
  /** Set when the owner skips the booking step during onboarding. */
  booking_setup_dismissed_at: string | null;
  /** Policy blob. See {@link BookingConfig}. */
  booking_config:          BookingConfig;
}
