-- operators_email_when_authed_check
--
-- Operators can now exist without an auth user (no-auth operator). Email is
-- already nullable on public.operators in the remote DB; this CHECK guards
-- against the inverse bug — a linked auth user with no denormalized email.
--
-- Apply via Supabase MCP `apply_migration` or `supabase db push`.
-- Rollback: alter table public.operators drop constraint operators_email_when_authed_chk;

alter table public.operators
  add constraint operators_email_when_authed_chk
  check (user_id is null or email is not null);
