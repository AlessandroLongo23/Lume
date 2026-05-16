-- Online booking — sub-project A: tenant-level configuration on `salons`.
--
-- Columns:
--   slug                          public URL handle, unique across all salons.
--                                 NULL until the owner opens the booking
--                                 settings page and chooses one. Format keeps
--                                 it URL-safe and free of leading/trailing
--                                 hyphens so `lume.app/<slug>` always works.
--   booking_enabled               master toggle. While false the public route
--                                 returns 404 regardless of `slug`.
--   booking_setup_dismissed_at    onboarding "skip for now" timestamp so the
--                                 step doesn't re-prompt every login.
--   booking_config                opaque JSON blob holding the v1 booking
--                                 policy (access mode, approval flow, lead
--                                 times, etc.). Defaulted to {} so existing
--                                 rows keep working; the application layer
--                                 fills missing keys with defaults.

alter table public.salons
  add column slug                       text,
  add column booking_enabled            boolean     not null default false,
  add column booking_setup_dismissed_at timestamptz,
  add column booking_config             jsonb       not null default '{}'::jsonb;

-- Slug shape: 2-64 chars, lowercase alphanumerics and hyphens, no leading or
-- trailing hyphen. Lets us route `lume.app/<slug>` without escaping.
alter table public.salons
  add constraint salons_slug_format
  check (
    slug is null
    or slug ~ '^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$'
  );

-- Unique only when set; multiple salons may have NULL slug pre-setup.
create unique index salons_slug_unique on public.salons (slug)
  where slug is not null;

comment on column public.salons.slug is
  'Public booking URL handle. NULL until set in /admin/impostazioni/salone/prenotazioni.';
comment on column public.salons.booking_enabled is
  'Master toggle for the public booking app at lume.app/<slug>.';
comment on column public.salons.booking_setup_dismissed_at is
  'Set when the owner skips the booking step during onboarding.';
comment on column public.salons.booking_config is
  'Booking policy. Keys: access_mode, allow_operator_choice, require_approval, approval_scope, min_lead_minutes, max_lead_days, cancel_window_hours, buffer_between_minutes, guest_email_required, public_message.';
