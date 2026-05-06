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
}
