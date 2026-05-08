-- pending_membership_invites: tracks outstanding cross-salon operator invitations.
-- Inserted by service-role when a known email is used in AddOperator (POST/addCredentials).
-- Claimed by the invitee via public.claim_membership_invite(token).

CREATE TABLE public.pending_membership_invites (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token       text        NOT NULL UNIQUE,
  salon_id    uuid        NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  email       text        NOT NULL,  -- lower-cased at write time
  target_role text        NOT NULL CHECK (target_role IN ('owner', 'operator')),
  invited_by  uuid        NOT NULL REFERENCES auth.users(id),
  expires_at  timestamptz NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  claimed_at  timestamptz NULL,
  declined_at timestamptz NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pending_membership_invites_email_salon_idx
  ON public.pending_membership_invites (lower(email), salon_id)
  WHERE claimed_at IS NULL AND declined_at IS NULL;

ALTER TABLE public.pending_membership_invites ENABLE ROW LEVEL SECURITY;

-- Salon staff (owner/operator at the active salon) can read invites for their salon.
CREATE POLICY "salon_staff_can_view_invites"
  ON public.pending_membership_invites
  FOR SELECT
  USING (salon_id = public.get_user_salon_id());

-- The invitee can read their own pending invite by email.
CREATE POLICY "invitee_can_view_own_invite"
  ON public.pending_membership_invites
  FOR SELECT
  USING (lower(email) = lower(auth.email()) AND claimed_at IS NULL AND declined_at IS NULL);

-- All writes go through service-role (no INSERT/UPDATE/DELETE policies for normal users).

-- Claim function: validates token, creates membership, marks invite claimed.
CREATE OR REPLACE FUNCTION public.claim_membership_invite(p_token TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite   public.pending_membership_invites%ROWTYPE;
  v_user_id  uuid := auth.uid();
  v_email    text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'invite_wrong_user');
  END IF;

  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_user_id;

  SELECT * INTO v_invite
  FROM public.pending_membership_invites
  WHERE token = p_token
    AND lower(email) = lower(v_email)
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Token doesn't exist OR email mismatch — return same error to avoid leaking token existence
    RETURN jsonb_build_object('error', 'invite_not_found');
  END IF;

  IF v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'invite_expired');
  END IF;

  IF v_invite.claimed_at IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'invite_already_claimed');
  END IF;

  IF v_invite.declined_at IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'invite_declined');
  END IF;

  INSERT INTO public.user_salon_memberships (user_id, salon_id, role, is_primary)
  VALUES (v_user_id, v_invite.salon_id, v_invite.target_role, false)
  ON CONFLICT (user_id, salon_id) DO NOTHING;

  UPDATE public.pending_membership_invites
  SET claimed_at = now()
  WHERE id = v_invite.id;

  RETURN jsonb_build_object('success', true, 'salon_id', v_invite.salon_id);
END;
$$;
