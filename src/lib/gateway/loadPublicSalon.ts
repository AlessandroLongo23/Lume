import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { OperatingHourDay } from '@/lib/stores/salonSettings';
import type { BookingConfig } from '@/lib/types/Salon';
import type { BookableService, PublicClosure } from '@/lib/booking/publicTypes';

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
  operating_hours: OperatingHourDay[];
  slot_granularity_min: number | null;
  booking_config: BookingConfig;
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
  const row = data as Record<string, unknown>;
  return {
    ...(row as unknown as PublicSalon),
    operating_hours: Array.isArray(row.operating_hours) ? (row.operating_hours as OperatingHourDay[]) : [],
    booking_config: (row.booking_config ?? {}) as BookingConfig,
  };
});

export const loadBookableServices = cache(async (salonId: string): Promise<BookableService[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_bookable_services', { p_salon_id: salonId });
  if (error || !data) return [];
  return data as BookableService[];
});

export const loadPublicClosures = cache(async (salonId: string): Promise<PublicClosure[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_public_closures', { p_salon_id: salonId });
  if (error || !data) return [];
  return data as PublicClosure[];
});

// Shape returned by `public.get_booking_by_token(text)` — see
// supabase/migrations/2026_05_16_08_booking_cancel.sql. NOT memoised: the
// underlying status changes when the visitor hits cancel, so we must re-read
// it on the post-action redirect.
export type PublicBookingByToken = {
  fiche_id: string;
  status: 'created' | 'pending_approval' | 'cancelled' | 'completed' | 'pending';
  start_at: string;
  end_at: string;
  service_name: string;
  operator_first: string | null;
  operator_last: string | null;
  salon_id: string;
  salon_name: string;
  salon_slug: string;
  salon_brand_color: string | null;
  salon_logo_url: string | null;
  salon_address: string | null;
  salon_city: string | null;
  salon_cap: string | null;
  salon_province: string | null;
  salon_phone: string | null;
  client_first: string | null;
  client_email: string | null;
  cancel_window_hours: number;
  can_cancel_now: boolean;
};

export async function loadBookingByToken(token: string): Promise<PublicBookingByToken | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc('get_booking_by_token', { p_token: token })
    .maybeSingle();
  if (error || !data) return null;
  return data as PublicBookingByToken;
}
