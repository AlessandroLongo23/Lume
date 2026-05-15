-- Per-client color used as the client's visual identity across the app:
-- calendar fiche blocks (when the salon's color_by_client toggle is on),
-- a small color-dot on the clients table, and a tinted avatar on the clients
-- grid card. NULL means "derive deterministically from client.id" — the app
-- hashes the UUID against the same 12-swatch palette used for service
-- categories. Non-NULL is an explicit per-client override.
alter table public.clients
  add column if not exists color text;
