-- Calendar coloring mode toggle. When TRUE (the new default), fiche blocks on
-- the calendar are colored by their client (so an appointment split across
-- multiple operators reads as one client's visit). When FALSE, blocks fall
-- back to their service-category color (the legacy behavior).
--
-- Default TRUE applies to existing rows as well — this is an opt-out flag,
-- and the new client-coloring behavior was requested by salons.
alter table public.salons
  add column if not exists color_by_client boolean not null default true;
