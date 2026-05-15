-- Audit log of every data-subject-rights request (Art. 12-22 GDPR).
-- One row per request: export, erasure, rectification, etc.
-- Used to:
--   * prove SLA compliance (1-month response window per Art. 12.3 GDPR)
--   * surface "at risk" badges in /platform when a request is approaching SLA
--   * provide an audit trail to authorities on demand

create table public.data_subject_requests (
  id                  uuid        primary key default gen_random_uuid(),
  salon_id            uuid                 references public.salons(id) on delete cascade,
  user_id             uuid                 references auth.users(id) on delete set null,
  request_type        text        not null check (request_type in (
                                      'export',
                                      'erasure',
                                      'rectification',
                                      'restriction',
                                      'objection',
                                      'access'
                                  )),
  requested_at        timestamptz not null default now(),
  fulfilled_at        timestamptz,
  fulfillment_notes   text
);

create index idx_dsr_salon on public.data_subject_requests(salon_id);
create index idx_dsr_user on public.data_subject_requests(user_id);
create index idx_dsr_open on public.data_subject_requests(requested_at) where fulfilled_at is null;

alter table public.data_subject_requests enable row level security;

-- Salon staff can see requests scoped to their salon (so the owner can audit).
-- A user always sees requests they themselves made.
create policy own_dsr_select on public.data_subject_requests
  for select
  using (
    user_id = auth.uid()
    or (salon_id is not null and salon_id = public.get_user_salon_id())
  );

-- Inserts only via service role from the export / delete-self / etc. endpoints.
-- No policy needed; service role bypasses RLS.

comment on table public.data_subject_requests is
  'Audit log of GDPR Art. 12-22 data-subject requests (export, erasure, etc.). Used for SLA tracking and authority audits.';
