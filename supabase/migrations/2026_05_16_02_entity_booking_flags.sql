-- Online booking — sub-project A: per-entity flags.
--
-- clients.can_book_online
--   Read only when `salons.booking_config.access_mode = 'selected'`. In the
--   other two modes ('public', 'clients_only') it's ignored. Default TRUE so
--   existing rows behave permissively the moment an owner switches to
--   'selected' — they pick the few to lock out, not the many to enable.
--
-- services.bookable_online
--   Default FALSE. The owner explicitly opts services IN. Safer than "every
--   service we sell is on the internet by default" — some services (e.g. a
--   discreet treatment, a free consult) shouldn't be in a public catalog.
--
-- fiches.booking_source
--   Tags whether a fiche came from staff entry or from the public booking
--   app. Used to render a small badge in the calendar and to power the
--   online-vs-manual report when populated for a full quarter.
--
-- fiches.status enum extension
--   Two new values: 'pending_approval' (owner requires approval; fiche is
--   provisional and slot is held) and 'cancelled' (client or staff cancelled
--   a booking; slot becomes free again). The column is `text` with no CHECK,
--   so the change is purely a TS-side enum extension — no DDL needed here.
--   This file documents that decision; the enum lives in
--   src/lib/types/ficheStatus.ts.

alter table public.clients
  add column can_book_online boolean not null default true;

alter table public.services
  add column bookable_online boolean not null default false;

alter table public.fiches
  add column booking_source text not null default 'manual'
    check (booking_source in ('manual', 'online'));

comment on column public.clients.can_book_online is
  'Per-client allow-list. Only consulted when salons.booking_config.access_mode = ''selected''.';
comment on column public.services.bookable_online is
  'Owner opts services into the public catalog explicitly. Default false.';
comment on column public.fiches.booking_source is
  'How the fiche was created: ''manual'' (staff) or ''online'' (public booking app).';
