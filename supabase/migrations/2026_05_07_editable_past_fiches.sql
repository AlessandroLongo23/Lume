-- Migrations for the "editable past & closed fiches" feature.
-- Applied via Supabase MCP apply_migration. Captured here for traceability.
--
-- Migration names (in apply order):
--   1. fiche_edits_audit_table
--   2. fiches_updated_at_trigger
--   3. update_fiche_with_audit_rpc
--
-- Rollback (reverse order):
--   drop function public.update_fiche_with_audit(uuid, jsonb, text);
--   drop trigger fiches_touch_updated_at on public.fiches;
--   drop function public.touch_fiches_updated_at();
--   alter table public.fiches drop column updated_by, drop column updated_at;
--   drop table public.fiche_edits;

-- ============================================================================
-- 1. fiche_edits_audit_table
-- ============================================================================

create table public.fiche_edits (
  id          uuid primary key default gen_random_uuid(),
  salon_id    uuid not null references public.salons(id) on delete cascade,
  fiche_id    uuid not null references public.fiches(id) on delete cascade,
  edited_by   uuid     null references auth.users(id)    on delete set null,
  edited_at   timestamptz not null default now(),
  changes     jsonb not null,
  reason      text     null,
  constraint fiche_edits_changes_is_object check (jsonb_typeof(changes) = 'object')
);

create index fiche_edits_fiche_id_edited_at_idx
  on public.fiche_edits (fiche_id, edited_at desc);

create index fiche_edits_salon_id_edited_at_idx
  on public.fiche_edits (salon_id, edited_at desc);

alter table public.fiche_edits enable row level security;

create policy "fiche_edits_select" on public.fiche_edits
  for select using (salon_id = get_user_salon_id());

create policy "fiche_edits_insert" on public.fiche_edits
  for insert with check (
    salon_id = get_user_salon_id()
    and edited_by = auth.uid()
  );

-- ============================================================================
-- 2. fiches_updated_at_trigger
-- ============================================================================

alter table public.fiches
  add column updated_at timestamptz not null default now(),
  add column updated_by uuid null references auth.users(id) on delete set null;

update public.fiches set updated_at = created_at;

create or replace function public.touch_fiches_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger fiches_touch_updated_at
  before update on public.fiches
  for each row execute function public.touch_fiches_updated_at();

-- ============================================================================
-- 3. update_fiche_with_audit_rpc
-- ============================================================================

create or replace function public.update_fiche_with_audit(
  p_fiche_id uuid,
  p_patch    jsonb,
  p_reason   text default null
)
returns public.fiches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller       uuid := auth.uid();
  v_caller_salon uuid;
  v_old          public.fiches;
  v_new          public.fiches;
  v_changes      jsonb := '{}'::jsonb;
  v_field        text;
  v_old_val      jsonb;
  v_new_val      jsonb;
  v_allowed      text[] := array[
    'datetime','client_id','note','status','total_override','miscela','tecnica','paid'
  ];
  v_invalid      text[];
begin
  if v_caller is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select array_agg(k) into v_invalid
  from jsonb_object_keys(p_patch) k
  where k <> all (v_allowed);

  if v_invalid is not null then
    raise exception 'Invalid patch fields: %', v_invalid using errcode = '22023';
  end if;

  select * into v_old from public.fiches where id = p_fiche_id;
  if not found then
    raise exception 'Fiche % not found', p_fiche_id using errcode = 'P0002';
  end if;

  v_caller_salon := public.get_user_salon_id();
  if v_caller_salon is null or v_caller_salon <> v_old.salon_id then
    raise exception 'Not authorized for this salon' using errcode = '42501';
  end if;

  for v_field in select k from jsonb_object_keys(p_patch) k loop
    v_new_val := p_patch -> v_field;
    v_old_val := to_jsonb(v_old) -> v_field;
    if v_new_val is distinct from v_old_val then
      v_changes := v_changes
        || jsonb_build_object(v_field, jsonb_build_object('old', v_old_val, 'new', v_new_val));
    end if;
  end loop;

  update public.fiches set
    datetime       = case when p_patch ? 'datetime'       then (p_patch ->> 'datetime')::timestamptz else datetime end,
    client_id      = case when p_patch ? 'client_id'      then (p_patch ->> 'client_id')::uuid       else client_id end,
    note           = case when p_patch ? 'note'           then  p_patch ->> 'note'                    else note end,
    status         = case when p_patch ? 'status'         then  p_patch ->> 'status'                  else status end,
    total_override = case when p_patch ? 'total_override' then (p_patch ->> 'total_override')::numeric else total_override end,
    miscela        = case when p_patch ? 'miscela'        then  p_patch ->> 'miscela'                 else miscela end,
    tecnica        = case when p_patch ? 'tecnica'        then  p_patch ->> 'tecnica'                 else tecnica end,
    paid           = case when p_patch ? 'paid'           then (p_patch ->> 'paid')::boolean         else paid end,
    updated_by     = v_caller
  where id = p_fiche_id
  returning * into v_new;

  if v_changes <> '{}'::jsonb or p_reason is not null then
    insert into public.fiche_edits (salon_id, fiche_id, edited_by, changes, reason)
    values (v_old.salon_id, p_fiche_id, v_caller, v_changes, p_reason);
  end if;

  return v_new;
end;
$$;

revoke all on function public.update_fiche_with_audit(uuid, jsonb, text) from public;
grant execute on function public.update_fiche_with_audit(uuid, jsonb, text) to authenticated;
