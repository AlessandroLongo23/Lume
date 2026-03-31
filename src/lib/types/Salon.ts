export type BusinessType = 'barber' | 'hair_salon' | 'beauty_center' | 'nails' | 'other';
export type OriginType = 'word_of_mouth' | 'social_media' | 'google' | 'event';

export interface Salon {
  id:            string;
  name:          string;
  type:          BusinessType;
  origin:        OriginType;
  invite_code:   string | null;
  owner_id:      string;
  trial_ends_at: string;
  created_at:    string;
}
