-- Online booking — sub-project A: which operator can perform which service.
--
-- The public booking app needs an answer to "for service X, which operators
-- can the client pick from?". A junction table is the simplest shape:
--   * No rows for a service  → anyone in the salon can perform it. This
--     keeps the default behavior unchanged for existing salons.
--   * Rows present           → only the listed operators are eligible.
--
-- Edited by the owner in the booking settings page (operator × service
-- matrix). Owner-only writes; everyone in the salon can read so the public
-- read path through the SECURITY DEFINER helpers can join it.

create table public.operator_services (
  id          uuid primary key default gen_random_uuid(),
  salon_id    uuid not null references public.salons(id)    on delete cascade,
  service_id  uuid not null references public.services(id)  on delete cascade,
  operator_id uuid not null references public.operators(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (service_id, operator_id)
);

create index idx_operator_services_salon       on public.operator_services (salon_id);
create index idx_operator_services_service     on public.operator_services (service_id);
create index idx_operator_services_operator    on public.operator_services (operator_id);

alter table public.operator_services enable row level security;

create policy operator_services_select on public.operator_services
  for select
  using (salon_id = public.get_user_salon_id());

create policy operator_services_insert on public.operator_services
  for insert
  with check (
    salon_id = public.get_user_salon_id()
    and public.get_user_role() = 'owner'
  );

create policy operator_services_update on public.operator_services
  for update
  using (
    salon_id = public.get_user_salon_id()
    and public.get_user_role() = 'owner'
  )
  with check (salon_id = public.get_user_salon_id());

create policy operator_services_delete on public.operator_services
  for delete
  using (
    salon_id = public.get_user_salon_id()
    and public.get_user_role() = 'owner'
  );

comment on table public.operator_services is
  'Operator × service eligibility for the public booking flow. Empty for a service means any operator.';
