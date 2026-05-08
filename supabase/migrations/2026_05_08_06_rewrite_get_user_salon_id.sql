-- New resolution order:
--   1. Admin impersonation (super_admin_impersonation) — unchanged.
--   2. User-chosen active salon (user_active_salon) — new.
--   3. Primary membership.
--   4. Earliest membership.
--   5. Legacy profiles.salon_id — fallback, kept until PR C.
--
-- Behavior for existing single-salon users is preserved: their backfilled
-- membership is is_primary=true, so step 3 returns the same salon as the
-- old step 2 (profiles.salon_id) did.

CREATE OR REPLACE FUNCTION public.get_user_salon_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT COALESCE(
    (SELECT salon_id FROM public.super_admin_impersonation
       WHERE user_id = auth.uid()),
    (SELECT salon_id FROM public.user_active_salon
       WHERE user_id = auth.uid()),
    (SELECT salon_id FROM public.user_salon_memberships
       WHERE user_id = auth.uid() AND is_primary = true
       LIMIT 1),
    (SELECT salon_id FROM public.user_salon_memberships
       WHERE user_id = auth.uid()
       ORDER BY joined_at ASC
       LIMIT 1),
    (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
  );
$function$;
