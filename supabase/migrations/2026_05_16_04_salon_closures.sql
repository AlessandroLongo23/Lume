-- Online booking — sub-project A: salon-level closures.
--
-- Owner-defined date ranges during which the salon is closed (holidays,
-- ferie d'agosto, refurbishment). Both endpoints are inclusive — a single-
-- day closure has starts_on = ends_on. Used by the slot oracle to make
-- closed days disappear from the public availability grid.
--
-- v1 supports concrete date ranges only. Recurring closures (every Sunday,
-- every August) are in the v2 backlog.

create table public.salon_closures (
  id         uuid primary key default gen_random_uuid(),
  salon_id   uuid not null references public.salons(id) on delete cascade,
  starts_on  date not null,
  ends_on    date not null,
  note       text,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create index idx_salon_closures_salon on public.salon_closures (salon_id);
-- Range queries during slot lookup hit on (salon_id, starts_on..ends_on);
-- a btree on each endpoint paired with the salon filter is enough at v1
-- volumes — we can revisit with a GiST tsrange index if traffic grows.
create index idx_salon_closures_range on public.salon_closures (salon_id, starts_on, ends_on);

alter table public.salon_closures enable row level security;

create policy salon_closures_select on public.salon_closures
  for select
  using (salon_id = public.get_user_salon_id());

create policy salon_closures_insert on public.salon_closures
  for insert
  with check (
    salon_id = public.get_user_salon_id()
    and public.get_user_role() = 'owner'
  );

create policy salon_closures_update on public.salon_closures
  for update
  using (
    salon_id = public.get_user_salon_id()
    and public.get_user_role() = 'owner'
  )
  with check (salon_id = public.get_user_salon_id());

create policy salon_closures_delete on public.salon_closures
  for delete
  using (
    salon_id = public.get_user_salon_id()
    and public.get_user_role() = 'owner'
  );

comment on table public.salon_closures is
  'Owner-defined closure date ranges (inclusive). Subtracted from operating hours by the slot oracle.';
