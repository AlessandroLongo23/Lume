export type BusinessType = 'barber' | 'hair_salon' | 'beauty_center' | 'nails' | 'other';
export type OriginType = 'word_of_mouth' | 'social_media' | 'google' | 'event';

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
}
