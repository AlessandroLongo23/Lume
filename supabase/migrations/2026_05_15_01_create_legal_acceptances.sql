-- Audit trail of every legal-document acceptance.
-- Lets Lume prove (to a court, to Datatilsynet, to the Garante) that a given
-- user agreed to a specific version of the Terms / Privacy / DPA / vessatorie
-- approval at a specific moment.
--
-- One row per (user, document, version) acceptance. Re-acceptances on a new
-- version add a new row; we never overwrite history.

create table public.legal_acceptances (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  salon_id        uuid                 references public.salons(id) on delete cascade,
  document_type   text        not null check (document_type in (
                                  'terms',
                                  'privacy',
                                  'dpa',
                                  'vessatorie_1341_1342',
                                  'cookie_policy'
                              )),
  document_version text       not null,
  accepted_at     timestamptz not null default now(),
  ip_address      inet,
  user_agent      text
);

create index idx_legal_acceptances_user on public.legal_acceptances(user_id);
create index idx_legal_acceptances_salon on public.legal_acceptances(salon_id);
create index idx_legal_acceptances_doc on public.legal_acceptances(document_type, document_version);

alter table public.legal_acceptances enable row level security;

-- A user always sees their own acceptances. Salon staff additionally see
-- acceptances scoped to their salon (so the owner can audit operator consents).
create policy own_acceptances_select on public.legal_acceptances
  for select
  using (
    user_id = auth.uid()
    or (salon_id is not null and salon_id = public.get_user_salon_id())
  );

-- Inserts are only via the service role (the /api/register route and the
-- in-app re-acceptance flow). Authenticated clients cannot insert directly,
-- so no INSERT policy here — service role bypasses RLS.

-- No UPDATE policy: acceptances are immutable history. To revoke, insert a
-- new row of a separate type rather than mutating the original.

-- DELETE only via auth.users / salons cascade (handled by FKs). No policy.

comment on table public.legal_acceptances is
  'Immutable record of legal-document acceptances (Terms, Privacy, DPA, vessatorie). Used to prove informed consent under GDPR + artt. 1341/1342 c.c.';
