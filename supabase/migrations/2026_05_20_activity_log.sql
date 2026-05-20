-- Migration for the salon-wide "Attività" activity / audit log.
-- Applied via Supabase MCP apply_migration. Captured here for traceability.
--
-- Generalizes the per-fiche audit pattern (fiche_edits + update_fiche_with_audit,
-- see 2026_05_07_editable_past_fiches.sql) into one append-only log covering every
-- domain table.
--
-- Capture is split by auth.uid() so nothing is logged twice:
--   * Browser-direct writes (anon key, JWT → auth.uid() set): the log_activity()
--     trigger records them automatically.
--   * Server-route writes (service-role key → auth.uid() null): the trigger no-ops;
--     the route logs them explicitly via the app-side logActivity() helper.
--
-- Migration names (in apply order):
--   1. activity_log_table
--   2. actor_display_name_fn
--   3. log_activity_trigger_fn
--   4. log_activity_attach_triggers
--
-- Rollback (reverse order):
--   do $$ declare t text; tables text[] := array[...same list...]; begin
--     foreach t in array tables loop
--       execute format('drop trigger if exists %I on public.%I', 'log_activity_'||t, t);
--     end loop; end $$;
--   drop function public.log_activity();
--   drop function public.actor_display_name(uuid);
--   drop table public.activity_log;

-- ============================================================================
-- 1. activity_log_table
-- ============================================================================

create table public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  salon_id    uuid not null references public.salons(id) on delete cascade,
  actor_id    uuid     null references auth.users(id) on delete set null,
  actor_name  text     null,                 -- display snapshot, survives staff deletion
  entity_type text not null,                 -- source table name, e.g. 'clients'
  entity_id   text     null,                 -- affected row id (text: most uuid, some bigint)
  action      text not null check (action in ('create','update','delete','bulk')),
  changes     jsonb    null,                 -- {field:{old,new}} | full-row snapshot | {ids:[…]}
  summary     text     null,                 -- optional Italian summary (app path / bulk)
  created_at  timestamptz not null default now()
);

create index activity_log_salon_created_idx on public.activity_log (salon_id, created_at desc);
create index activity_log_entity_idx        on public.activity_log (salon_id, entity_type, entity_id);

alter table public.activity_log enable row level security;

-- SELECT only: every salon staff member can read their own salon's log.
create policy "activity_log_select" on public.activity_log
  for select using (salon_id = get_user_salon_id());

-- No INSERT/UPDATE/DELETE policies → append-only & tamper-resistant from clients.
-- Writes happen via the SECURITY DEFINER trigger and via service-role (app helper).

-- Live feed support.
do $$ begin
  alter publication supabase_realtime add table public.activity_log;
exception when others then null; end $$;

-- ============================================================================
-- 2. actor_display_name_fn
-- ============================================================================

create or replace function public.actor_display_name(p_uid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select nullif(btrim(coalesce(o."firstName",'') || ' ' || coalesce(o."lastName",'')), '')
       from public.operators o where o.user_id = p_uid limit 1),
    (select nullif(btrim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), '')
       from public.profiles p where p.id = p_uid limit 1),
    (select p.email from public.profiles p where p.id = p_uid limit 1)
  );
$$;

-- ============================================================================
-- 3. log_activity_trigger_fn
-- ============================================================================
-- AFTER row trigger. Defensive: any failure to log is swallowed so a logging
-- hiccup can never roll back the user's real write.

create or replace function public.log_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor   uuid := auth.uid();
  v_salon   uuid;
  v_id      text;
  v_action  text;
  v_changes jsonb;
  v_old     jsonb;
  v_new     jsonb;
  v_key     text;
  v_ignore  text[] := array['updated_at','created_at','updated_by'];
begin
  -- Service-role writes (auth.uid() null) are logged by the app via logActivity().
  if v_actor is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    v_salon   := new.salon_id;
    v_id      := to_jsonb(new) ->> 'id';
    v_action  := 'create';
    v_changes := to_jsonb(new) - v_ignore;
  elsif tg_op = 'DELETE' then
    v_salon   := old.salon_id;
    v_id      := to_jsonb(old) ->> 'id';
    v_action  := 'delete';
    v_changes := to_jsonb(old) - v_ignore;
  else
    v_salon   := new.salon_id;
    v_id      := to_jsonb(new) ->> 'id';
    v_action  := 'update';
    v_old     := to_jsonb(old);
    v_new     := to_jsonb(new);
    v_changes := '{}'::jsonb;
    for v_key in select jsonb_object_keys(v_new) loop
      if v_key <> all (v_ignore)
         and (v_new -> v_key) is distinct from (v_old -> v_key) then
        v_changes := v_changes || jsonb_build_object(
          v_key, jsonb_build_object('old', v_old -> v_key, 'new', v_new -> v_key));
      end if;
    end loop;
    if v_changes = '{}'::jsonb then
      return new;  -- nothing meaningful changed
    end if;
  end if;

  begin
    insert into public.activity_log
      (salon_id, actor_id, actor_name, entity_type, entity_id, action, changes)
    values
      (v_salon, v_actor, public.actor_display_name(v_actor),
       tg_table_name, v_id, v_action, v_changes);
  exception when others then
    -- Never let auditing break a real write.
    null;
  end;

  return coalesce(new, old);
end;
$$;

-- ============================================================================
-- 4. log_activity_attach_triggers
-- ============================================================================
-- One AFTER-row trigger per domain table. Excludes audit/derived/system tables
-- (fiche_edits, *_price_history, notifications, user_active_salon, import_jobs,
-- data_subject_requests, legal_acceptances, pending_membership_invites, profiles).

do $$
declare
  t text;
  tables text[] := array[
    'clients','fiches','fiche_services','fiche_products','fiche_payments',
    'services','service_categories','service_products','products','product_categories',
    'operators','operator_services','operator_unavailabilities','coupons','coupon_redemptions',
    'orders','order_products','abbonamenti','manufacturers','suppliers',
    'obiettivi','salon_closures','spese','user_salon_memberships'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists %I on public.%I', 'log_activity_' || t, t);
    execute format(
      'create trigger %I after insert or update or delete on public.%I '
      || 'for each row execute function public.log_activity()',
      'log_activity_' || t, t);
  end loop;
end $$;

-- ============================================================================
-- 5. lock_down_function_execution
-- ============================================================================
-- These SECURITY DEFINER functions must NOT be reachable through PostgREST.
--   * log_activity() is a trigger function — never called as an RPC; the trigger
--     fires regardless of EXECUTE grants.
--   * actor_display_name() would otherwise let anon/authenticated enumerate staff
--     names and emails by uuid. Only the server (service_role) needs it.

revoke execute on function public.log_activity()            from public, anon, authenticated;
revoke execute on function public.actor_display_name(uuid)  from public, anon, authenticated;
grant  execute on function public.actor_display_name(uuid)  to service_role;
