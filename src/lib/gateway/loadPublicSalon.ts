import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

// Shape returned by `public.get_salon_by_slug(text)` — see
// supabase/migrations/2026_05_16_06_booking_security_definer.sql.
export type PublicSalon = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  cap: string | null;
  province: string | null;
  phone: string | null;
  public_email: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  brand_color: string | null;
  operating_hours: unknown;
  slot_granularity_min: number | null;
  booking_config: Record<string, unknown> | null;
};

// React's per-request `cache()` so layout + page + nested server components
// share a single round-trip. The SECURITY DEFINER function returns NULL when
// the slug is unknown OR the salon has booking disabled — both collapse to a
// 404 (the layout calls `notFound()`).
export const loadPublicSalon = cache(async (slug: string): Promise<PublicSalon | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc('get_salon_by_slug', { p_slug: slug })
    .maybeSingle();
  if (error || !data) return null;
  return data as PublicSalon;
});
