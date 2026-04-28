# Lume E2E tests

Playwright runs against a **separate `lume-staging` Supabase project**. Tests must NEVER touch the production Supabase URL — `.env.test` is the only source of test credentials and `.gitignore`'d.

## One-time setup

1. **Create a staging Supabase project** on supabase.com. Free tier is fine.

2. **Dump prod schema, apply to staging.** Replace the project ref and DB URL.
   ```bash
   # Requires `supabase` CLI logged in. Schema only, no data.
   supabase db dump \
     --project-ref vfzoyiosnljhdheggqhz \
     --schema public \
     --data=false \
     > tests/.schema/baseline.sql

   # Apply to staging — get the connection string from staging project settings.
   psql "postgresql://postgres:PASSWORD@db.STAGING-REF.supabase.co:5432/postgres" \
     -f tests/.schema/baseline.sql
   ```

3. **Seed deterministic data in staging:**
   - One row in `salons` — note its UUID, this becomes `E2E_TEST_SALON_ID`.
   - Four auth users via Supabase Auth dashboard or `supabase.auth.admin.createUser`:
     - `e2e-admin@lume-test.local`    → `profiles.role = 'admin'`
     - `e2e-owner@lume-test.local`    → `profiles.role = 'owner'`,    `salons.owner_id` = this user
     - `e2e-operator@lume-test.local` → `profiles.role = 'operator'`, row in `operators` linking to the test salon
     - `e2e-client@lume-test.local`   → row in `clients` linking to the test salon (no profile role)

4. **Fill `.env.test`:**
   ```bash
   cp .env.test.example .env.test
   # Edit with staging URL/keys, the salon ID, and four passwords.
   ```

5. **Verify:**
   ```bash
   npm run test:e2e -- smoke.spec.ts --project=anon   # public + redirect checks
   npm run test:e2e -- auth.spec.ts                   # all four logins
   npm run test:e2e -- admin/clienti.spec.ts          # CRUD via seed
   ```

## Schema-sync rule

Any prod schema change (new column, table, constraint) **must** be replayed on staging the same day, otherwise tests will start failing with cryptic Postgres errors. Until we adopt Supabase migrations, the workflow is:

```bash
# 1. Re-dump
supabase db dump --project-ref vfzoyiosnljhdheggqhz --schema public --data=false \
  > tests/.schema/baseline.sql
# 2. Re-apply (idempotent on a fresh DB; for diffs, write a one-off migration SQL)
psql "$STAGING_DB_URL" -f tests/.schema/baseline.sql
```

Long-term: adopt `supabase migrations` so this becomes `supabase db push --db-url $STAGING_DB_URL`.

## Run commands

| Command | What it does |
|---|---|
| `npm run test:e2e` | Run all projects (anon + setup + 4 role projects) |
| `npm run test:e2e -- smoke.spec.ts --project=anon` | Public smoke only |
| `npm run test:e2e -- --project=owner` | Run owner-scoped tests (admin/*) |
| `npm run test:e2e:ui` | Playwright UI mode (recommended for development) |
| `npm run test:e2e:debug` | Step through with the Playwright Inspector |
| `npm run test:e2e:codegen` | Record selectors against `localhost:3000` |
| `npx playwright show-report` | Open the HTML report after a run |

## Adding a new test

- Public/unauthenticated → `tests/e2e/*.spec.ts`, runs under the `anon` project.
- Owner-scoped (most admin/* features) → `tests/e2e/admin/*.spec.ts`, runs under the `owner` project.
- Other roles — change the project's `testIgnore`/`testMatch` in [playwright.config.ts](../playwright.config.ts).
- DB-touching → use `tests/fixtures/seed.ts` helpers; **always** scope by `salon_id = testEnv.testSalonId`. Cleanup in `finally` blocks.

## MCP coexistence

`@playwright/mcp` is configured in [.mcp.json](../.mcp.json) and shares the Chromium binary installed by `npx playwright install`. Use prompts like *"Use playwright mcp to open `http://localhost:3000/admin/clienti` and screenshot the table"* for interactive debugging — the test runner is for asserted regressions.
