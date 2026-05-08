-- Per-user "currently selected salon" pointer for non-admins with multiple memberships.
-- Distinct from super_admin_impersonation (Path B): admin impersonation has different
-- threat model (auditable, transient) vs. normal user picking their own salon.

CREATE TABLE public.user_active_salon (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX user_active_salon_salon_idx ON public.user_active_salon (salon_id);

ALTER TABLE public.user_active_salon ENABLE ROW LEVEL SECURITY;

-- The user can read their own active salon. Nothing else.
CREATE POLICY user_active_salon_self_select
  ON public.user_active_salon
  FOR SELECT
  USING (user_id = auth.uid());

-- Writes via service role only (the /api/account/active-salon route).
