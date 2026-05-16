-- Online booking — sub-project E: extra SECURITY DEFINER helpers for the
-- public booking read path.
--
-- Two more public-facing functions that round out the surface the anon
-- client touches when a visitor lands on `lume.app/<slug>`:
--
--   * get_bookable_operators — the operator picker (shown when
--     booking_config.allow_operator_choice = true) needs to list operators
--     eligible to perform a given bookable service. Honors the same
--     operator_services whitelist semantics as the slot oracle: empty set =
--     anyone can perform.
--
--   * get_public_closures — the date picker greys out closed days client-
--     side instead of round-tripping to the slot oracle for every day in
--     the month. Past closures are dropped so the client never has to
--     filter; future closures (including ongoing ones whose end date is
--     today or later) are returned ordered by start date.
--
-- Both follow the same locked-down pattern as the other public helpers:
-- search_path is pinned, execute is revoked from PUBLIC and granted to
-- anon + authenticated, and every function gates on `booking_enabled` at
-- the entry point so flipping the master toggle off makes the surface go
-- dark immediately.


-- ─── get_bookable_operators ────────────────────────────────────────────────
create or replace function public.get_bookable_operators(
  p_salon_id   uuid,
  p_service_id uuid
)
returns table (
  id         uuid,
  first_name text,
  last_name  text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select o.id, o."firstName", o."lastName", o.avatar_url
  from public.operators o
  join public.salons s on s.id = o.salon_id
  where o.salon_id = p_salon_id
    and o.archived_at is null
    and s.booking_enabled = true
    and exists (
      select 1 from public.services sv
      where sv.id = p_service_id
        and sv.salon_id = p_salon_id
        and sv.bookable_online = true
        and sv.archived_at is null
    )
    and (
      not exists (
        select 1 from public.operator_services os
        where os.service_id = p_service_id
          and os.salon_id = p_salon_id
      )
      or exists (
        select 1 from public.operator_services os
        where os.service_id = p_service_id
          and os.operator_id = o.id
      )
    )
  order by o."firstName", o."lastName";
$$;

revoke execute on function public.get_bookable_operators(uuid, uuid) from public;
grant  execute on function public.get_bookable_operators(uuid, uuid) to anon, authenticated;

comment on function public.get_bookable_operators(uuid, uuid) is
  'Public list of operators eligible for a service. Honors operator_services whitelist (empty = anyone).';


-- ─── get_public_closures ───────────────────────────────────────────────────
create or replace function public.get_public_closures(p_salon_id uuid)
returns table (
  starts_on date,
  ends_on   date
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select c.starts_on, c.ends_on
  from public.salon_closures c
  join public.salons s on s.id = c.salon_id
  where c.salon_id = p_salon_id
    and s.booking_enabled = true
    and c.ends_on >= current_date
  order by c.starts_on;
$$;

revoke execute on function public.get_public_closures(uuid) from public;
grant  execute on function public.get_public_closures(uuid) to anon, authenticated;

comment on function public.get_public_closures(uuid) is
  'Upcoming closures for the public date picker. Filters out past closures.';
