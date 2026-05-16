-- Online booking — sub-project A: SECURITY DEFINER helpers.
--
-- These functions are the ENTIRE surface area the anon (unauthenticated)
-- client touches when a visitor lands on `lume.app/<slug>`. They run as the
-- function owner (postgres), bypassing RLS, and return ONLY the fields the
-- public booking page needs — never raw client lists, never another salon's
-- fiches, never operator phone numbers, never internal status flags.
--
-- Pattern for every function:
--   * `security definer` + `set search_path = public, pg_temp` (lock down
--     resolution so a malicious schema can't redirect us).
--   * `revoke execute on function ... from public` + `grant execute ... to
--     anon, authenticated` so we control reachability explicitly.
--   * Gate on `salons.booking_enabled = true` at the entry of every public
--     read path. Flipping the toggle off makes the whole public surface go
--     dark, regardless of slug.
--
-- The five functions form a layered surface:
--   1. get_salon_by_slug          — landing page profile + config snapshot
--   2. get_bookable_services      — service catalog (filtered by opt-in)
--   3. is_client_allowed_to_book  — selected-mode whitelist probe
--   4. get_available_slots        — free time slots for a service+day+op
--   5. create_online_booking      — atomic write under advisory lock


-- ─── 1. get_salon_by_slug ──────────────────────────────────────────────────
-- Returns the public profile of a salon iff booking is enabled. The whole
-- booking_config blob is returned so the public app can drive its own UI
-- (operator picker visibility, approval copy, guest-email enforcement, …)
-- without further round-trips.
create or replace function public.get_salon_by_slug(p_slug text)
returns table (
  id                   uuid,
  name                 text,
  address              text,
  city                 text,
  cap                  text,
  province             text,
  phone                text,
  public_email         text,
  logo_url             text,
  favicon_url          text,
  brand_color          text,
  operating_hours      jsonb,
  slot_granularity_min integer,
  booking_config       jsonb
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    s.id, s.name, s.address, s.city, s.cap, s.province,
    s.phone, s.public_email, s.logo_url, s.favicon_url, s.brand_color,
    s.operating_hours, s.slot_granularity_min, s.booking_config
  from public.salons s
  where s.slug = lower(p_slug)
    and s.booking_enabled = true;
$$;

revoke execute on function public.get_salon_by_slug(text) from public;
grant  execute on function public.get_salon_by_slug(text) to anon, authenticated;

comment on function public.get_salon_by_slug(text) is
  'Public booking page entry point. Returns NULL if booking_enabled is off.';


-- ─── 2. get_bookable_services ──────────────────────────────────────────────
-- Service catalog for the public booking page. Filtered to services the
-- owner explicitly opted in (bookable_online = true), excluding archived
-- ones. Also gated on `booking_enabled` for defense in depth.
create or replace function public.get_bookable_services(p_salon_id uuid)
returns table (
  id          uuid,
  name        text,
  duration    bigint,
  price       double precision,
  description text,
  category_id uuid,
  image_url   text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    sv.id, sv.name, sv.duration, sv.price, sv.description,
    sv.category_id, sv."imageUrl" as image_url
  from public.services sv
  join public.salons s on s.id = sv.salon_id
  where sv.salon_id = p_salon_id
    and sv.bookable_online = true
    and sv.archived_at is null
    and s.booking_enabled = true
  order by sv.name nulls last;
$$;

revoke execute on function public.get_bookable_services(uuid) from public;
grant  execute on function public.get_bookable_services(uuid) to anon, authenticated;

comment on function public.get_bookable_services(uuid) is
  'Public service catalog. Honors bookable_online opt-in and booking_enabled gate.';


-- ─── 3. is_client_allowed_to_book ──────────────────────────────────────────
-- Used during the identity step in `selected` access mode. Returns true
-- when access mode is anything other than 'selected', or when a matching
-- client row exists with can_book_online = true.
--
-- Matching is exact on phoneNumber (cheaper than normalisation and good
-- enough for v1 — Italian numbers entered in a single style). Email falls
-- back to case-insensitive equality.
create or replace function public.is_client_allowed_to_book(
  p_salon_id uuid,
  p_phone    text,
  p_email    text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when coalesce(s.booking_config->>'access_mode', 'public') <> 'selected' then true
    else exists (
      select 1
      from public.clients c
      where c.salon_id = p_salon_id
        and c.can_book_online = true
        and c.archived_at is null
        and (
          (p_phone is not null and p_phone <> '' and c."phoneNumber" = p_phone)
          or (p_email is not null and p_email <> '' and lower(c.email) = lower(p_email))
        )
    )
  end
  from public.salons s
  where s.id = p_salon_id and s.booking_enabled = true;
$$;

revoke execute on function public.is_client_allowed_to_book(uuid, text, text) from public;
grant  execute on function public.is_client_allowed_to_book(uuid, text, text) to anon, authenticated;

comment on function public.is_client_allowed_to_book(uuid, text, text) is
  'Whitelist probe for selected-mode booking. Returns true outside selected mode.';


-- ─── 4. get_available_slots ────────────────────────────────────────────────
-- The slot oracle. Mirrors the TS `wouldCollide()` logic in
-- src/lib/utils/calendar-conflicts.ts so the public flow and the admin
-- calendar agree on what's free.
--
-- Algorithm:
--   1. Validate salon (booking_enabled) and service (bookable_online).
--   2. Honor min_lead_minutes (now + lead) and max_lead_days (today + max).
--   3. Refuse closed days from salon_closures.
--   4. For each eligible operator (operator_services if any row exists for
--      this service, otherwise every active operator):
--        a. Pick effective schedule (operator working_hours or salon).
--        b. For each shift on the day, enumerate slots at
--           slot_granularity_min steps.
--        c. Drop slots that conflict with an unavailability or with an
--           existing non-cancelled fiche_service (with optional buffer).
--
-- Buffer is applied symmetrically (slot ± buffer) so adjacent bookings keep
-- the prescribed gap on both sides.
create or replace function public.get_available_slots(
  p_salon_id    uuid,
  p_service_id  uuid,
  p_operator_id uuid,           -- nullable: NULL = any eligible operator
  p_day         date
)
returns table (
  start_at    timestamptz,
  end_at      timestamptz,
  operator_id uuid
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_salon          record;
  v_service        record;
  v_config         jsonb;
  v_buffer_min     int;
  v_granularity    int;
  v_min_lead_min   int;
  v_max_lead_days  int;
  v_earliest       timestamptz;
  v_latest_day     date;
  v_dow            int;

  v_op             record;
  v_schedule       jsonb;
  v_day_entry      jsonb;
  v_shift          jsonb;
  v_shift_start    time;
  v_shift_end      time;
  v_shift_end_ts   timestamptz;
  v_slot_start     timestamptz;
  v_slot_end       timestamptz;
  v_duration_int   interval;
  v_buffer_int     interval;
begin
  -- 1. Salon must exist and have booking enabled
  select id, operating_hours, slot_granularity_min, booking_config
  into v_salon
  from public.salons
  where id = p_salon_id and booking_enabled = true;

  if not found then return; end if;

  v_config        := coalesce(v_salon.booking_config, '{}'::jsonb);
  v_buffer_min    := coalesce((v_config->>'buffer_between_minutes')::int, 0);
  v_granularity   := coalesce(v_salon.slot_granularity_min, 15);
  v_min_lead_min  := coalesce((v_config->>'min_lead_minutes')::int, 120);
  v_max_lead_days := coalesce((v_config->>'max_lead_days')::int, 60);

  v_earliest   := now() + make_interval(mins => v_min_lead_min);
  v_latest_day := (current_date + make_interval(days => v_max_lead_days))::date;

  if p_day < current_date or p_day > v_latest_day then return; end if;

  -- 2. Service must be online-bookable for this salon
  select sv.id, sv.duration, sv.salon_id
  into v_service
  from public.services sv
  where sv.id = p_service_id
    and sv.salon_id = p_salon_id
    and sv.bookable_online = true
    and sv.archived_at is null;

  if not found then return; end if;

  v_duration_int := make_interval(mins => v_service.duration::int);
  v_buffer_int   := make_interval(mins => v_buffer_min);

  -- 3. Closure?
  if exists (
    select 1 from public.salon_closures
    where salon_id = p_salon_id
      and p_day between starts_on and ends_on
  ) then return; end if;

  v_dow := extract(dow from p_day)::int;

  -- 4. Iterate eligible operators
  for v_op in
    select o.id as op_id, o.working_hours
    from public.operators o
    where o.salon_id = p_salon_id
      and o.archived_at is null
      and (p_operator_id is null or o.id = p_operator_id)
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
  loop
    -- Effective schedule: operator override, else salon-wide
    if v_op.working_hours is not null and jsonb_typeof(v_op.working_hours) = 'array'
       and jsonb_array_length(v_op.working_hours) > 0 then
      v_schedule := v_op.working_hours;
    else
      v_schedule := v_salon.operating_hours;
    end if;

    -- Find this day's entry
    v_day_entry := null;
    select value into v_day_entry
    from jsonb_array_elements(v_schedule)
    where (value->>'day')::int = v_dow
    limit 1;

    if v_day_entry is null then continue; end if;
    if coalesce((v_day_entry->>'isOpen')::boolean, false) is not true then continue; end if;

    -- Walk each shift on the day
    for v_shift in
      select value from jsonb_array_elements(v_day_entry->'shifts')
    loop
      v_shift_start  := (v_shift->>'start')::time;
      v_shift_end    := (v_shift->>'end')::time;
      -- Operating-hours strings are wall-clock time in the salon's locale.
      -- Lume is Italian-only at v1, so Europe/Rome is correct everywhere.
      -- When we expand outside Italy, plumb a `salons.timezone` column and
      -- substitute it here.
      v_shift_end_ts := (p_day::timestamp + v_shift_end) at time zone 'Europe/Rome';

      v_slot_start := (p_day::timestamp + v_shift_start) at time zone 'Europe/Rome';

      while v_slot_start + v_duration_int <= v_shift_end_ts loop
        v_slot_end := v_slot_start + v_duration_int;

        -- Lead-time gate
        if v_slot_start < v_earliest then
          v_slot_start := v_slot_start + make_interval(mins => v_granularity);
          continue;
        end if;

        -- Operator unavailability (buffered)
        if exists (
          select 1
          from public.operator_unavailabilities ou
          where ou.operator_id = v_op.op_id
            and ou.start_at < v_slot_end + v_buffer_int
            and ou.end_at   > v_slot_start - v_buffer_int
        ) then
          v_slot_start := v_slot_start + make_interval(mins => v_granularity);
          continue;
        end if;

        -- Existing booking overlap (cancelled fiches are ignored)
        if exists (
          select 1
          from public.fiche_services fs
          join public.fiches f on f.id = fs.fiche_id
          where fs.operator_id = v_op.op_id
            and coalesce(f.status, '') <> 'cancelled'
            and fs.start_time < v_slot_end + v_buffer_int
            and fs.end_time   > v_slot_start - v_buffer_int
        ) then
          v_slot_start := v_slot_start + make_interval(mins => v_granularity);
          continue;
        end if;

        -- Free — emit
        start_at    := v_slot_start;
        end_at      := v_slot_end;
        operator_id := v_op.op_id;
        return next;

        v_slot_start := v_slot_start + make_interval(mins => v_granularity);
      end loop;
    end loop;
  end loop;

  return;
end;
$$;

revoke execute on function public.get_available_slots(uuid, uuid, uuid, date) from public;
grant  execute on function public.get_available_slots(uuid, uuid, uuid, date) to anon, authenticated;

comment on function public.get_available_slots(uuid, uuid, uuid, date) is
  'Slot oracle for the public booking page. Server-side mirror of wouldCollide().';


-- ─── 5. create_online_booking ──────────────────────────────────────────────
-- Atomic booking creation. Re-checks slot freshness UNDER a transaction-
-- scoped advisory lock keyed on (salon, operator) so two simultaneous
-- requests for the same slot serialise instead of both succeeding.
--
-- Client dedupe: exact phoneNumber match first, then email (case-insensitive).
-- If neither matches, a new client row is created with can_book_online=true.
--
-- Returns the new fiche id and its final status ('created' or
-- 'pending_approval') so the public page can branch its confirmation copy.
create or replace function public.create_online_booking(
  p_salon_id            uuid,
  p_service_id          uuid,
  p_operator_id         uuid,
  p_start_at            timestamptz,
  p_client_first        text,
  p_client_last         text,
  p_client_phone_prefix text,
  p_client_phone        text,
  p_client_email        text,
  p_note                text
)
returns table (
  fiche_id uuid,
  status   text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_salon       record;
  v_service     record;
  v_config      jsonb;
  v_buffer_min  int;
  v_buffer_int  interval;
  v_end_at      timestamptz;
  v_status      text;
  v_client_id   uuid;
  v_fiche_id    uuid;
  v_lock_key    bigint;
begin
  -- 1. Salon
  select id, booking_config, booking_enabled
  into v_salon
  from public.salons
  where id = p_salon_id;

  if not found or v_salon.booking_enabled is not true then
    raise exception 'booking_not_enabled' using errcode = 'P0001';
  end if;

  v_config     := coalesce(v_salon.booking_config, '{}'::jsonb);
  v_buffer_min := coalesce((v_config->>'buffer_between_minutes')::int, 0);
  v_buffer_int := make_interval(mins => v_buffer_min);

  -- 2. Service
  select sv.id, sv.duration, sv.salon_id, sv.price, sv.name
  into v_service
  from public.services sv
  where sv.id = p_service_id
    and sv.salon_id = p_salon_id
    and sv.bookable_online = true
    and sv.archived_at is null;

  if not found then
    raise exception 'service_not_bookable' using errcode = 'P0001';
  end if;

  v_end_at := p_start_at + make_interval(mins => v_service.duration::int);

  -- 3. Whitelist check (in `selected` mode)
  if coalesce(v_config->>'access_mode', 'public') = 'selected' then
    if not public.is_client_allowed_to_book(p_salon_id, p_client_phone, p_client_email) then
      raise exception 'client_not_whitelisted' using errcode = 'P0001';
    end if;
  end if;

  -- 4. Serialise per (salon, operator) to prevent two clients from both
  --    winning the same slot in a race.
  v_lock_key := hashtextextended(p_salon_id::text || '|' || coalesce(p_operator_id::text, 'any'), 0);
  perform pg_advisory_xact_lock(v_lock_key);

  -- 5. Re-validate slot under lock
  if exists (
    select 1
    from public.fiche_services fs
    join public.fiches f on f.id = fs.fiche_id
    where fs.operator_id = p_operator_id
      and coalesce(f.status, '') <> 'cancelled'
      and fs.start_time < v_end_at   + v_buffer_int
      and fs.end_time   > p_start_at - v_buffer_int
  ) then
    raise exception 'slot_unavailable' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.operator_unavailabilities ou
    where ou.operator_id = p_operator_id
      and ou.start_at < v_end_at   + v_buffer_int
      and ou.end_at   > p_start_at - v_buffer_int
  ) then
    raise exception 'slot_unavailable' using errcode = 'P0001';
  end if;

  -- 6. Find or create client (phone first, then email, else new row)
  if p_client_phone is not null and p_client_phone <> '' then
    select id into v_client_id
    from public.clients
    where salon_id = p_salon_id
      and "phoneNumber" = p_client_phone
      and archived_at is null
    limit 1;
  end if;

  if v_client_id is null and p_client_email is not null and p_client_email <> '' then
    select id into v_client_id
    from public.clients
    where salon_id = p_salon_id
      and lower(email) = lower(p_client_email)
      and archived_at is null
    limit 1;
  end if;

  if v_client_id is null then
    insert into public.clients (
      salon_id, "firstName", "lastName", email,
      "phonePrefix", "phoneNumber", can_book_online
    )
    values (
      p_salon_id, p_client_first, p_client_last,
      nullif(p_client_email, ''),
      nullif(p_client_phone_prefix, ''),
      nullif(p_client_phone, ''),
      true
    )
    returning id into v_client_id;
  end if;

  -- 7. Decide status from approval flag
  v_status := case
    when coalesce((v_config->>'require_approval')::boolean, false) then 'pending_approval'
    else 'created'
  end;

  -- 8. Create fiche + fiche_service
  insert into public.fiches (
    salon_id, client_id, datetime, status, note, booking_source
  )
  values (
    p_salon_id, v_client_id, p_start_at, v_status, nullif(p_note, ''), 'online'
  )
  returning id into v_fiche_id;

  insert into public.fiche_services (
    fiche_id, salon_id, operator_id, service_id, name,
    start_time, end_time, duration, list_price, final_price
  )
  values (
    v_fiche_id, p_salon_id, p_operator_id, p_service_id, v_service.name,
    p_start_at, v_end_at, v_service.duration::int,
    coalesce(v_service.price, 0), coalesce(v_service.price, 0)
  );

  fiche_id := v_fiche_id;
  status   := v_status;
  return next;
end;
$$;

revoke execute on function public.create_online_booking(uuid, uuid, uuid, timestamptz, text, text, text, text, text, text) from public;
grant  execute on function public.create_online_booking(uuid, uuid, uuid, timestamptz, text, text, text, text, text, text) to anon, authenticated;

comment on function public.create_online_booking(uuid, uuid, uuid, timestamptz, text, text, text, text, text, text) is
  'Atomic public-side booking creation. Locks per (salon, operator) to serialise concurrent requests.';
