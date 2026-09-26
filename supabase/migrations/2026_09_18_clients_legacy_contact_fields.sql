-- Contact and profile fields carried over from salons' previous CRMs.
-- Stored so imported data isn't lost; the UI doesn't read or edit them yet.
-- All free text, copied as the source had it (no normalisation), NULL when
-- the source had nothing.
alter table public.clients
  add column if not exists address text,
  add column if not exists postal_code text,
  add column if not exists city text,
  add column if not exists landline text,
  add column if not exists profession text,
  add column if not exists referral_source text;

comment on column public.clients.address is 'Street address from a legacy CRM import. Not surfaced in the UI yet.';
comment on column public.clients.postal_code is 'CAP from a legacy CRM import. Not surfaced in the UI yet.';
comment on column public.clients.city is 'City of residence from a legacy CRM import. Not surfaced in the UI yet.';
comment on column public.clients.landline is 'Landline number, raw, from a legacy CRM import. The main phone stays in phonePrefix/phoneNumber. Not surfaced in the UI yet.';
comment on column public.clients.profession is 'Profession from a legacy CRM import. Not surfaced in the UI yet.';
comment on column public.clients.referral_source is 'How the client found the salon, from a legacy CRM import. Not surfaced in the UI yet.';
