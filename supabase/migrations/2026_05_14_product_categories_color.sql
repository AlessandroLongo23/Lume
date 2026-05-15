-- Mirror service_categories: give product_categories a user-chosen color so they
-- can render as colored badges in tables (and anywhere products show a category).
alter table public.product_categories
  add column if not exists color text not null default '#6366F1';
