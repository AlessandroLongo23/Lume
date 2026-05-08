-- Platform admin is a global flag, not a salon-scoped role.
-- Once memberships own (owner | operator), profiles.role becomes redundant for those —
-- but admin needs to live somewhere. This is its new home.

ALTER TABLE public.profiles
  ADD COLUMN is_platform_admin boolean NOT NULL DEFAULT false;

CREATE INDEX profiles_is_platform_admin_idx
  ON public.profiles (is_platform_admin)
  WHERE is_platform_admin;
