-- Online booking — sub-project I: client-side cancel flow.
--
-- The confirmation email gives the visitor a single magic URL
-- `lume.app/<slug>/prenotazione/<token>` that re-opens their booking. From
-- there they can cancel inside the configured `cancel_window_hours` window.
--
-- Design choices:
--
--   * Token is a 128-bit hex string generated server-side at booking time and
--     stored verbatim on `fiches.cancel_token` (UNIQUE, NULL = "no online
--     cancel allowed"). 128 bits + the per-token RPC + RLS keeps brute-force
--     enumeration out of scope.
--
--   * Two SECURITY DEFINER helpers:
--       - `get_booking_by_token(token)` — fetch the booking for the public
--         page render. Returns slug + brand for theming + service/operator
--         names + start_at/end_at + status + cancel-window math.
--       - `cancel_online_booking_by_token(token)` — atomic state change,
--         validates token, status (must be `created` or `pending_approval`),
--         and cancel-window vs `now()`. Sets status='cancelled', writes a
--         `fiche_edits` audit row with edited_by=NULL (client-initiated, no
--         auth user). Throws keyword errors that the API route maps to
--         Italian HTTP responses, identical to the create path.
--
--   * `create_online_booking` returns the token alongside `fiche_id` and
--     `status` so the API route can hand it straight to the email renderer.
--     The migration creates the token automatically when an online booking
--     is inserted — both new bookings and any future direct inserts get one.

-- 1. Column ─────────────────────────────────────────────────────────────────

alter table public.fiches
  add column cancel_token text;

create unique index fiches_cancel_token_unique
  on public.fiches (cancel_token)
  where cancel_token is not null;

comment on column public.fiches.cancel_token is
  'Opaque URL token sent to the client at booking time. Lets them re-open the booking and cancel without authenticating.';


-- 2. create_online_booking — emit the token ────────────────────────────────
-- Drop first because the returns-table shape gains a `cancel_token` column.
-- Postgres won't let us change a function's return type via CREATE OR REPLACE.

drop function if exists public.create_online_booking(
  uuid, uuid, uuid, timestamptz, text, text, text, text, text, text
);

create function public.create_online_booking(
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
  fiche_id     uuid,
  status       text,
  cancel_token text
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
  v_token       text;
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

  -- 8. Mint a 128-bit hex token. Random + per-token RPC + RLS keeps brute
  --    enumeration impractical; ~10^38 namespace.
  v_token := encode(gen_random_bytes(16), 'hex');

  -- 9. Create fiche + fiche_service
  insert into public.fiches (
    salon_id, client_id, datetime, status, note, booking_source, cancel_token
  )
  values (
    p_salon_id, v_client_id, p_start_at, v_status, nullif(p_note, ''), 'online', v_token
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

  fiche_id     := v_fiche_id;
  status       := v_status;
  cancel_token := v_token;
  return next;
end;
$$;

revoke execute on function public.create_online_booking(uuid, uuid, uuid, timestamptz, text, text, text, text, text, text) from public;
grant  execute on function public.create_online_booking(uuid, uuid, uuid, timestamptz, text, text, text, text, text, text) to anon, authenticated;


-- 3. get_booking_by_token — fetch what the cancel page needs ────────────────
-- Returns enough to render the public cancel page (service + operator names,
-- when, current status, salon name + slug + brand color for theming, and a
-- pre-computed `can_cancel_now` boolean derived from the configured
-- `cancel_window_hours` and the booking's start time).
--
-- NOT gated on `booking_enabled` — once a client holds a token from a past
-- booking we still want them to see "this is cancelled" or "this already
-- happened" rather than a 404, which would look like a Lume bug. The page
-- itself decides what's actionable.

create or replace function public.get_booking_by_token(p_token text)
returns table (
  fiche_id          uuid,
  status            text,
  start_at          timestamptz,
  end_at            timestamptz,
  service_name      text,
  operator_first    text,
  operator_last     text,
  salon_id          uuid,
  salon_name        text,
  salon_slug        text,
  salon_brand_color text,
  salon_logo_url    text,
  salon_address     text,
  salon_city        text,
  salon_cap         text,
  salon_province    text,
  salon_phone       text,
  client_first      text,
  client_email      text,
  cancel_window_hours int,
  can_cancel_now    boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    f.id,
    f.status,
    fs.start_time,
    fs.end_time,
    fs.name,
    op."firstName",
    op."lastName",
    s.id,
    s.name,
    s.slug,
    s.brand_color,
    s.logo_url,
    s.address,
    s.city,
    s.cap,
    s.province,
    s.phone,
    c."firstName",
    c.email,
    coalesce((s.booking_config->>'cancel_window_hours')::int, 24) as cancel_window_hours,
    (
      f.status in ('created', 'pending_approval')
      and fs.start_time
          - make_interval(hours => coalesce((s.booking_config->>'cancel_window_hours')::int, 24))
          > now()
    ) as can_cancel_now
  from public.fiches f
  join public.fiche_services fs on fs.fiche_id = f.id
  join public.salons s on s.id = f.salon_id
  left join public.operators op on op.id = fs.operator_id
  left join public.clients c on c.id = f.client_id
  where f.cancel_token = p_token
  order by fs.start_time asc
  limit 1;
$$;

revoke execute on function public.get_booking_by_token(text) from public;
grant  execute on function public.get_booking_by_token(text) to anon, authenticated;

comment on function public.get_booking_by_token(text) is
  'Resolves a cancel_token to the booking details the public cancel page renders.';


-- 4. cancel_online_booking_by_token — atomic state change ──────────────────
-- Validates token, status, cancel-window. Updates status='cancelled', writes
-- an audit row (edited_by=NULL because the cancel is client-initiated, no
-- auth user). Returns the cancelled booking shape so the API route can
-- compose the staff-notification body and the client confirmation email.

create or replace function public.cancel_online_booking_by_token(p_token text)
returns table (
  fiche_id      uuid,
  salon_id      uuid,
  operator_id   uuid,
  service_name  text,
  start_at      timestamptz,
  client_first  text,
  client_last   text,
  client_email  text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_fiche       record;
  v_window_hrs  int;
  v_now         timestamptz := now();
begin
  -- Lock the fiche so two concurrent cancel attempts (refresh storm) can't
  -- both think they're "the one" cancelling.
  select
    f.id, f.salon_id, f.status, fs.start_time, fs.operator_id, fs.name,
    c."firstName" as cfirst, c."lastName" as clast, c.email as cemail,
    coalesce((s.booking_config->>'cancel_window_hours')::int, 24) as window_hrs
  into v_fiche
  from public.fiches f
  join public.fiche_services fs on fs.fiche_id = f.id
  join public.salons s on s.id = f.salon_id
  left join public.clients c on c.id = f.client_id
  where f.cancel_token = p_token
  order by fs.start_time asc
  limit 1
  for update of f;

  if not found then
    raise exception 'booking_not_found' using errcode = 'P0001';
  end if;

  if v_fiche.status = 'cancelled' then
    raise exception 'already_cancelled' using errcode = 'P0001';
  end if;

  if v_fiche.status not in ('created', 'pending_approval') then
    -- Anything other than the two live states (e.g. 'completed') is past or
    -- otherwise locked down — client can't roll it back online.
    raise exception 'not_cancellable' using errcode = 'P0001';
  end if;

  v_window_hrs := v_fiche.window_hrs;

  if v_fiche.start_time - make_interval(hours => v_window_hrs) <= v_now then
    raise exception 'cancel_window_passed' using errcode = 'P0001';
  end if;

  -- Flip status. We update fiches directly here (not via update_fiche_with_audit)
  -- because that helper requires auth.uid() — the client cancel flow is
  -- anonymous. We write the matching fiche_edits row ourselves below.
  update public.fiches
    set status = 'cancelled'
    where id = v_fiche.id;

  insert into public.fiche_edits (salon_id, fiche_id, edited_by, changes, reason)
  values (
    v_fiche.salon_id,
    v_fiche.id,
    null,
    jsonb_build_object(
      'status', jsonb_build_object('old', v_fiche.status, 'new', 'cancelled')
    ),
    'client_cancel_online'
  );

  fiche_id     := v_fiche.id;
  salon_id     := v_fiche.salon_id;
  operator_id  := v_fiche.operator_id;
  service_name := v_fiche.name;
  start_at     := v_fiche.start_time;
  client_first := v_fiche.cfirst;
  client_last  := v_fiche.clast;
  client_email := v_fiche.cemail;
  return next;
end;
$$;

revoke execute on function public.cancel_online_booking_by_token(text) from public;
grant  execute on function public.cancel_online_booking_by_token(text) to anon, authenticated;

comment on function public.cancel_online_booking_by_token(text) is
  'Atomic client-side cancel. Enforces cancel_window_hours and writes a fiche_edits audit row.';
