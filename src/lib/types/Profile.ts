export interface Profile {
  id:         string;
  salon_id:   string;
  first_name: string;
  last_name:  string;
  email:      string;
  role:       'owner' | 'operator';
  created_at: string;
}
