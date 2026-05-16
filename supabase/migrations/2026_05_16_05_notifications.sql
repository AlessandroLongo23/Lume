-- Online booking — sub-project A: in-app notifications.
--
-- One row per (recipient × event). The fan-out logic that decides who
-- receives each event (owner only / owner + assigned operator / owner +
-- any-staff) lives in the application layer — this table is dumb storage.
--
-- v1 surfaces these in the header notification bell (sub-project H) with
-- mark-as-read. A dedicated /notifications page with history and filters is
-- v2 backlog.

create table public.notifications (
  id              uuid primary key default gen_random_uuid(),
  salon_id        uuid not null references public.salons(id)  on delete cascade,
  user_id         uuid not null references auth.users(id)     on delete cascade,
  type            text not null,
  title           text not null,
  body            text,
  link            text,
  action_required boolean not null default false,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

-- Recipient lookup hits (user_id, read_at IS NULL, created_at DESC) on every
-- bell open; partial index keeps unread fetches O(unread) regardless of
-- archive size.
create index idx_notifications_user_unread
  on public.notifications (user_id, created_at desc)
  where read_at is null;
create index idx_notifications_user_all
  on public.notifications (user_id, created_at desc);
create index idx_notifications_salon
  on public.notifications (salon_id);

alter table public.notifications enable row level security;

-- A user only ever sees their OWN notifications. The salon_id filter is a
-- belt-and-braces second condition so a stale notification from a previous
-- salon (during impersonation or a multi-salon staff move) can't surface in
-- the wrong context.
create policy notifications_select on public.notifications
  for select
  using (
    user_id = auth.uid()
    and salon_id = public.get_user_salon_id()
  );

-- A user may mark their own notification as read; no other field updates.
-- The application enforces the "only read_at changes" rule on the client.
create policy notifications_update on public.notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- A user may delete their own notifications (clear inbox).
create policy notifications_delete on public.notifications
  for delete
  using (user_id = auth.uid());

-- Inserts only via service role from the fan-out emitter functions. No
-- INSERT policy needed — service role bypasses RLS.

comment on table public.notifications is
  'Per-user in-app notifications. Inserts are server-side via the booking event emitters.';
