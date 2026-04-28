import type { ProfilePreferences } from './Preferences';

export interface Profile {
  id:          string;
  salon_id:    string;
  first_name:  string;
  last_name:   string;
  email:       string;
  role:        'owner' | 'operator';
  created_at:  string;
  avatar_url:  string | null;
  preferences: ProfilePreferences;
}
