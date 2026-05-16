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
