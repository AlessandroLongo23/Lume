-- Multi-salon memberships: one row per (user, salon, role).
-- Replaces profiles.salon_id + profiles.role for owner/operator scoping.
-- profiles columns stay populated through the transition (PR C drops them later).

CREATE TABLE public.user_salon_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'operator')),
  is_primary boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, salon_id)
);

CREATE INDEX user_salon_memberships_user_idx ON public.user_salon_memberships (user_id);
CREATE INDEX user_salon_memberships_salon_idx ON public.user_salon_memberships (salon_id);

-- At most one primary membership per user.
CREATE UNIQUE INDEX user_salon_memberships_one_primary_per_user
  ON public.user_salon_memberships (user_id)
  WHERE is_primary;

ALTER TABLE public.user_salon_memberships ENABLE ROW LEVEL SECURITY;

-- The user themselves can read their own memberships.
CREATE POLICY user_salon_memberships_self_select
  ON public.user_salon_memberships
  FOR SELECT
  USING (user_id = auth.uid());

-- Salon staff can see other staff memberships at their active salon.
CREATE POLICY user_salon_memberships_staff_select
  ON public.user_salon_memberships
  FOR SELECT
  USING (salon_id = public.get_user_salon_id());

-- INSERT/UPDATE/DELETE: no policies. All writes go through service-role
-- code paths (registration, operator API, future cross-salon claim flow).
