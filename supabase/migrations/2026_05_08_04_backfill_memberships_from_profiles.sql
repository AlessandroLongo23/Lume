-- Backfill memberships from profiles.
-- Today profiles is 1:1 with auth.users (one role, one salon_id), so every
-- backfilled membership is the user's primary salon by definition.

INSERT INTO public.user_salon_memberships (user_id, salon_id, role, is_primary)
SELECT id, salon_id, role, true
FROM public.profiles
WHERE salon_id IS NOT NULL AND role IN ('owner', 'operator')
ON CONFLICT (user_id, salon_id) DO NOTHING;
