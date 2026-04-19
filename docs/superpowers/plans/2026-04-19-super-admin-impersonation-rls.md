# Super-Admin Impersonation: RLS-Aware End-to-End Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make super-admin impersonation work end-to-end so that when a super-admin activates a target salon, every client-side Supabase query (subject to RLS) returns the target salon's data — not the super-admin's profile-default salon.

**Architecture:** Today the RLS function `get_user_salon_id()` reads `profiles.salon_id` and has no way to consult per-request impersonation state. We'll introduce a server-side truth table `public.super_admin_impersonation` (one row per actively-impersonating super-admin), and update `get_user_salon_id()` to consult that table first. The existing cookies (`lume-active-salon-id`, `lume-impersonating`) remain as fast-path UI signals (sidebar label, banner visibility) and are written/cleared atomically alongside the table. This keeps the cookie-driven sidebar label consistent with the RLS-driven data, with the table as the authoritative source for security.

**Tech Stack:** Supabase Postgres (RLS + SQL functions), Supabase JS client (browser + server), Next.js 16 App Router (route handlers + cookies API), Supabase MCP (`apply_migration`, `execute_sql`) for schema changes — this project has **no local `supabase/migrations/` folder**, migrations are applied directly via the MCP.

**Preconditions already in place (from prior commit):**
- `getActiveSalonId(fallback, isSuperAdmin)` ignores a lone `lume-active-salon-id` cookie for super-admins unless paired with `lume-impersonating=1` ([src/lib/utils/getActiveSalonId.ts](../../../src/lib/utils/getActiveSalonId.ts))
- `resolveWorkspace` super-admin branch requires both cookies together and deletes orphans ([src/lib/gateway/resolveWorkspace.ts](../../../src/lib/gateway/resolveWorkspace.ts))
- `/auth/logout` clears both impersonation cookies ([src/app/auth/logout/route.ts](../../../src/app/auth/logout/route.ts))

**Note on testing:** This project has no automated test framework (per CLAUDE.md). Every "verification" step in this plan is either a DB query run via `mcp__supabase__execute_sql` or a manual UI check against `npm run dev`.

---

## File Structure

**New DB objects** (applied via `mcp__supabase__apply_migration`):
- `public.super_admin_impersonation` — table holding one row per actively-impersonating super-admin
- `public.get_user_salon_id()` — modified to prefer the impersonation row

**Modified files:**
- `src/app/api/platform/enter-salon/route.ts` — write table row alongside cookies
- `src/app/api/platform/exit-impersonation/route.ts` — delete table row alongside cookies
- `src/app/auth/logout/route.ts` — delete any lingering impersonation row on logout
- `src/lib/gateway/resolveWorkspace.ts` — super-admin branch reads table as the authoritative "is impersonating" check; cookies become a fast-path hint only
- `src/app/api/gateway/set-salon/route.ts` — on super-admin impersonation activation, ensure the table row matches

**No changes required to:**
- Client-side stores. They already use the browser Supabase client with RLS — once `get_user_salon_id()` reads the table, every store automatically sees the impersonated salon's data.

---

## Task 1: Create `super_admin_impersonation` table

**Files:**
- Migration: apply via `mcp__supabase__apply_migration` (name: `super_admin_impersonation`)

**Why a dedicated table rather than a JWT claim:** Supabase custom access token hooks would require the client to refresh the JWT on every impersonation enter/exit — a round-trip we can avoid. A table row is read by an already-executing SQL function (`get_user_salon_id`) with zero client coordination.

- [ ] **Step 1: Verify current state — no table yet**

Run via MCP:
```sql
SELECT to_regclass('public.super_admin_impersonation') AS table_exists;
```
Expected: `{"table_exists": null}`

- [ ] **Step 2: Apply the migration**

Call `mcp__supabase__apply_migration` with name `super_admin_impersonation` and the query:

```sql
CREATE TABLE public.super_admin_impersonation (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  salon_id   uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS is enabled but no policies are defined: nothing reaches this table
-- through the anon/authenticated role. The service role bypasses RLS, and
-- the SECURITY DEFINER function in Task 2 reads it with elevated rights.
ALTER TABLE public.super_admin_impersonation ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.super_admin_impersonation IS
  'One row per actively-impersonating super-admin. Read by get_user_salon_id(); written by /api/platform/enter-salon; deleted by /api/platform/exit-impersonation and /auth/logout.';
```

- [ ] **Step 3: Verify table exists and RLS is enabled**

Run via MCP:
```sql
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'super_admin_impersonation';
```
Expected: `[{"relname":"super_admin_impersonation","relrowsecurity":true}]`

- [ ] **Step 4: Verify no policies exist (so anon/authenticated roles can't touch it)**

Run via MCP:
```sql
SELECT count(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'super_admin_impersonation';
```
Expected: `[{"policy_count":0}]`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(db): add super_admin_impersonation table for RLS-aware impersonation"
```

---

## Task 2: Update `get_user_salon_id()` to prefer the impersonation row

**Files:**
- Migration: apply via `mcp__supabase__apply_migration` (name: `get_user_salon_id_honor_impersonation`)

**Why SECURITY DEFINER:** The function must read `super_admin_impersonation`, whose RLS has no policies — so ordinary role calls would return 0 rows. `SECURITY DEFINER` runs the function as its owner (postgres), which bypasses RLS. We keep `search_path` pinned to prevent search-path injection.

- [ ] **Step 1: Capture the current function body for rollback reference**

Run via MCP:
```sql
SELECT prosrc FROM pg_proc WHERE proname = 'get_user_salon_id';
```
Record the output (should be the two-line profile lookup). If a rollback is needed, restore it verbatim.

- [ ] **Step 2: Apply the migration**

Call `mcp__supabase__apply_migration` with name `get_user_salon_id_honor_impersonation` and the query:

```sql
CREATE OR REPLACE FUNCTION public.get_user_salon_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT salon_id FROM public.super_admin_impersonation WHERE user_id = auth.uid()),
    (SELECT salon_id FROM public.profiles           WHERE id      = auth.uid())
  );
$$;

COMMENT ON FUNCTION public.get_user_salon_id() IS
  'Returns the effective salon_id for the current auth.uid(). For super-admins actively impersonating (row present in super_admin_impersonation), returns the impersonated salon_id. Otherwise returns profiles.salon_id.';
```

- [ ] **Step 3: Verify the new function compiles and returns the expected shape**

Run via MCP:
```sql
SELECT prosrc, prosecdef, provolatile
FROM pg_proc
WHERE proname = 'get_user_salon_id';
```
Expected: body contains both `super_admin_impersonation` and `profiles`; `prosecdef = true`; `provolatile = 's'` (stable).

- [ ] **Step 4: Verify the function still returns the super-admin's profile salon when no impersonation row exists**

Run via MCP (substitute the real longoa user id: `d3ab9dd0-292d-42b3-a31f-7304fe103ef9`):
```sql
SELECT COALESCE(
  (SELECT salon_id FROM public.super_admin_impersonation WHERE user_id = 'd3ab9dd0-292d-42b3-a31f-7304fe103ef9'),
  (SELECT salon_id FROM public.profiles WHERE id = 'd3ab9dd0-292d-42b3-a31f-7304fe103ef9')
) AS effective_salon_id;
```
Expected: `c942ee3d-85da-48fc-8265-a67aadd903d1` ("Dacci un Taglio" — longoa's profile salon, no impersonation active).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(db): get_user_salon_id() prefers super_admin_impersonation row

RLS policies across the schema call get_user_salon_id() to scope rows to
the caller's tenant. For super-admins actively impersonating a salon, the
function now returns the impersonated salon_id, so client-side Supabase
queries return the target salon's data."
```

---

## Task 3: Update `/api/platform/enter-salon` to write the impersonation row

**Files:**
- Modify: `src/app/api/platform/enter-salon/route.ts` (current line count: ~46)

**Contract:** The table row MUST be written before (or atomically with) the cookies. If the row write fails, no cookies are set and the route returns an error — the super-admin is never put into an inconsistent "UI thinks impersonating but RLS doesn't" state.

- [ ] **Step 1: Read current file to confirm the pre-edit shape**

Run: open `src/app/api/platform/enter-salon/route.ts`. Confirm it currently does:
1. `requireSuperAdmin` guard
2. Parse `salonId` from body
3. Look up the target salon exists
4. Set both cookies
5. Return `{ redirect: '/admin/calendario' }`

- [ ] **Step 2: Replace the cookie-setting block with upsert-then-cookies**

In `src/app/api/platform/enter-salon/route.ts`, locate the block:

```typescript
  const cookieStore = await cookies();
  const baseCookie = {
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path:     '/',
    maxAge:   COOKIE_MAX_AGE,
  };
  cookieStore.set('lume-active-salon-id', salonId, { ...baseCookie, httpOnly: true });
  cookieStore.set('lume-impersonating',   '1',     { ...baseCookie, httpOnly: false });

  return NextResponse.json({ redirect: '/admin/calendario' });
```

Replace it with:

```typescript
  // Write the RLS truth row FIRST. If this fails we return an error and do
  // not set any cookies, keeping UI and data consistent (both off).
  const { error: upsertError } = await supabaseAdmin
    .from('super_admin_impersonation')
    .upsert(
      { user_id: guard.userId, salon_id: salonId },
      { onConflict: 'user_id' },
    );

  if (upsertError) {
    console.error('enter-salon upsert error:', upsertError);
    return NextResponse.json({ error: 'Impossibile attivare il salone' }, { status: 500 });
  }

  const cookieStore = await cookies();
  const baseCookie = {
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path:     '/',
    maxAge:   COOKIE_MAX_AGE,
  };
  cookieStore.set('lume-active-salon-id', salonId, { ...baseCookie, httpOnly: true });
  cookieStore.set('lume-impersonating',   '1',     { ...baseCookie, httpOnly: false });

  return NextResponse.json({ redirect: '/admin/calendario' });
```

- [ ] **Step 3: Confirm `requireSuperAdmin` already exposes `userId`**

Open `src/lib/gateway/requireSuperAdmin.ts` and confirm the returned object contains `userId`. If it does not, adjust the guard in a prior line:

```typescript
  const guard = await requireSuperAdmin();
  if (guard.response) return guard.response;
```

and use `guard.userId` only if that field exists. If it does not, change the file to instead call the server Supabase client to fetch the user id:

```typescript
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  // ... and use user.id instead of guard.userId
```

Import `createClient` from `@/lib/supabase/server` at the top of the file if adding this fallback.

- [ ] **Step 4: Typecheck + lint**

Run:
```bash
npm run check
```
Expected: no errors.

- [ ] **Step 5: Manual verify — enter impersonation writes the row**

Start dev server (`npm run dev`), log in as longoa02@gmail.com, navigate to `/platform/salons`, click the "Enter" button on "Sinergia Della Bellezza". Then via MCP:

```sql
SELECT user_id, salon_id, created_at
FROM public.super_admin_impersonation
WHERE user_id = 'd3ab9dd0-292d-42b3-a31f-7304fe103ef9';
```
Expected: one row with `salon_id = d368d644-c99b-4c45-8b04-b11891cae20b`.

- [ ] **Step 6: Manual verify — operators list now shows Sinergia's real operators**

Still in the impersonation session, navigate to `/admin/operatori`. The table should now show **Laura Spada** and **Mario Spada** (the actual Sinergia operators per the DB query in the original investigation), NOT Tizio Rossi / Caio Verdi (which are Dacci un Taglio's).

If the list still shows Dacci un Taglio operators, the browser Supabase session may be cached — hard-refresh (Cmd+Shift+R).

- [ ] **Step 7: Commit**

```bash
git add src/app/api/platform/enter-salon/route.ts
git commit -m "feat(impersonation): write super_admin_impersonation row atomically with cookies"
```

---

## Task 4: Update `/api/platform/exit-impersonation` to delete the row

**Files:**
- Modify: `src/app/api/platform/exit-impersonation/route.ts`

- [ ] **Step 1: Replace the handler body**

In `src/app/api/platform/exit-impersonation/route.ts`, replace the entire POST handler body (currently just cookie deletion) with:

```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { requireSuperAdmin } from '@/lib/gateway/requireSuperAdmin';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST() {
  const guard = await requireSuperAdmin();
  if (guard.response) return guard.response;

  // Delete the RLS truth row first. Even if this fails we still clear the
  // cookies so the UI doesn't lie — next request will see an orphan and
  // resolveWorkspace will clean up.
  const supabaseAdmin = getAdminClient();
  const { error: deleteError } = await supabaseAdmin
    .from('super_admin_impersonation')
    .delete()
    .eq('user_id', guard.userId);

  if (deleteError) {
    console.error('exit-impersonation delete error:', deleteError);
  }

  const cookieStore = await cookies();
  cookieStore.delete('lume-active-salon-id');
  cookieStore.delete('lume-impersonating');

  return NextResponse.json({ redirect: '/platform/salons' });
}
```

If `guard.userId` is not available (same situation as Task 3 Step 3), fall back to `supabase.auth.getUser()` using the server client.

- [ ] **Step 2: Typecheck + lint**

Run:
```bash
npm run check
```
Expected: no errors.

- [ ] **Step 3: Manual verify — exit impersonation removes the row**

With the impersonation session from Task 3 still active, click the "Torna alla piattaforma" button in the ImpersonationBanner (top of admin layout). You should be redirected to `/platform/salons`. Then via MCP:

```sql
SELECT count(*) AS row_count
FROM public.super_admin_impersonation
WHERE user_id = 'd3ab9dd0-292d-42b3-a31f-7304fe103ef9';
```
Expected: `[{"row_count":0}]`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/platform/exit-impersonation/route.ts
git commit -m "feat(impersonation): delete super_admin_impersonation row on exit"
```

---

## Task 5: Update `/auth/logout` to clear lingering impersonation rows

**Files:**
- Modify: `src/app/auth/logout/route.ts`

**Why:** A super-admin may log out while impersonation is still active (browser close, explicit logout, session expiry). Without this, the row outlives the session and on next login the super-admin would resume impersonation silently. We want logout to be a clean slate.

- [ ] **Step 1: Replace the handler**

Current file contents:
```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const response = NextResponse.json({ ok: true });
  response.cookies.delete('lume-active-salon-id');
  response.cookies.delete('lume-impersonating');
  return response;
}
```

Replace with:

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST() {
  const supabase = await createClient();

  // Grab the user id BEFORE signing out — after signOut() the session is gone.
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.auth.signOut();

  // Clear any lingering super-admin impersonation row so the next login
  // starts clean (no auto-resume of a prior impersonation session).
  if (user) {
    const supabaseAdmin = getAdminClient();
    const { error } = await supabaseAdmin
      .from('super_admin_impersonation')
      .delete()
      .eq('user_id', user.id);
    if (error) console.error('logout impersonation cleanup error:', error);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete('lume-active-salon-id');
  response.cookies.delete('lume-impersonating');
  return response;
}
```

- [ ] **Step 2: Typecheck + lint**

Run:
```bash
npm run check
```
Expected: no errors.

- [ ] **Step 3: Manual verify — logout clears the row**

1. Log in as longoa02, enter impersonation for Sinergia (verify row exists via Task 3 Step 5 query).
2. Click the account avatar → "Esci" (logout).
3. Run:
```sql
SELECT count(*) AS row_count
FROM public.super_admin_impersonation
WHERE user_id = 'd3ab9dd0-292d-42b3-a31f-7304fe103ef9';
```
Expected: `[{"row_count":0}]`.

- [ ] **Step 4: Commit**

```bash
git add src/app/auth/logout/route.ts
git commit -m "feat(auth): clear super_admin_impersonation row on logout"
```

---

## Task 6: Make `resolveWorkspace` consult the table as source of truth

**Files:**
- Modify: `src/lib/gateway/resolveWorkspace.ts`

**Why:** After Task 5, the table is the authoritative "is this super-admin currently impersonating" record. The cookies are a fast-path hint. If the cookies and the table disagree (e.g. `apply_migration` deployed while a super-admin's session was active, or a direct DB edit), we should prefer the table and resync the cookies.

- [ ] **Step 1: Locate the super-admin branch (lines ~27-53 after the prior cookie-pairing fix)**

Open `src/lib/gateway/resolveWorkspace.ts` and find the block starting with `if (profile?.is_super_admin) {`.

- [ ] **Step 2: Replace the super-admin branch**

Replace the existing super-admin branch with:

```typescript
  if (profile?.is_super_admin) {
    // The super_admin_impersonation table is the source of truth for RLS. The
    // cookies are fast-path UI hints that should mirror it. If they disagree
    // (legacy cookies left over from before this table existed, a stale
    // httpOnly cookie surviving a logout, direct DB edits, etc.), trust the
    // table and resync the cookies to match.
    const cookieStore = await cookies();
    const cookieSalonId = cookieStore.get('lume-active-salon-id')?.value ?? null;
    const cookieImpersonating = cookieStore.get('lume-impersonating')?.value === '1';

    const { data: imp } = await supabaseAdmin
      .from('super_admin_impersonation')
      .select('salon_id')
      .eq('user_id', userId)
      .maybeSingle();

    const tableSalonId: string | null = imp?.salon_id ?? null;
    const isImpersonating = !!tableSalonId;

    // Resync cookies if they drifted from the table.
    if (isImpersonating) {
      if (cookieSalonId !== tableSalonId) {
        cookieStore.set('lume-active-salon-id', tableSalonId!, {
          httpOnly: true,
          secure:   process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path:     '/',
          maxAge:   60 * 60 * 24 * 30,
        });
      }
      if (!cookieImpersonating) {
        cookieStore.set('lume-impersonating', '1', {
          httpOnly: false,
          secure:   process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path:     '/',
          maxAge:   60 * 60 * 24 * 30,
        });
      }
    } else if (cookieSalonId || cookieImpersonating) {
      cookieStore.delete('lume-active-salon-id');
      cookieStore.delete('lume-impersonating');
    }

    return {
      businessContexts: [],
      clientContexts:   [],
      redirect:         isImpersonating ? '/admin/calendario' : '/platform',
      activeSalonId:    tableSalonId,
      isSuperAdmin:     true,
    };
  }
```

- [ ] **Step 3: Typecheck + lint**

Run:
```bash
npm run check
```
Expected: no errors.

- [ ] **Step 4: Manual verify — cookies resync from table**

1. Log in as longoa02, enter impersonation for Sinergia.
2. Via browser devtools, delete the `lume-active-salon-id` cookie (simulate a stale-cookie scenario).
3. Reload `/admin/operatori`. After reload, inspect the request cookies — `lume-active-salon-id` should be re-set to Sinergia's id by `resolveWorkspace` (triggered by `StoreInitializer.resolve()`).
4. The operators list should still show Sinergia's operators.

- [ ] **Step 5: Manual verify — orphan cleanup still works**

1. With no impersonation row (Task 4 Step 3 already cleared it), manually set `lume-active-salon-id` cookie in devtools to some salon id.
2. Reload `/admin/calendario`. `resolveWorkspace` should see no table row, no impersonation → delete the cookie.
3. Inspect cookies: `lume-active-salon-id` is gone.

- [ ] **Step 6: Commit**

```bash
git add src/lib/gateway/resolveWorkspace.ts
git commit -m "feat(impersonation): resolveWorkspace reads super_admin_impersonation as truth

Cookies become a fast-path UI hint that resyncs from the table on every
gateway call, so legacy or drifted cookies can no longer mislead the UI."
```

---

## Task 7: Ensure `/api/gateway/set-salon` doesn't let non-super-admins touch the table

**Files:**
- Modify: `src/app/api/gateway/set-salon/route.ts`

**Why:** `set-salon` is the generic "switch active salon" endpoint used by multi-salon owners. It only touches the `lume-active-salon-id` cookie today. After this plan, we need to guarantee it does NOT write to `super_admin_impersonation` — that table is exclusively managed by the two `/api/platform/*` routes. Also: for super-admins calling set-salon directly (edge case), reject unless the target matches their current impersonation row.

- [ ] **Step 1: Read current file**

Open `src/app/api/gateway/set-salon/route.ts`. Confirm it currently sets only `lume-active-salon-id` and performs an isSuperAdmin bypass.

- [ ] **Step 2: Add an explicit super-admin guard**

Replace the super-admin bypass block:

```typescript
    if (!(await isSuperAdmin(user.id))) {
      const workspace = await resolveWorkspace(user.id);
      const allSalonIds = [
        ...workspace.businessContexts.map((c) => c.salonId),
        ...workspace.clientContexts.map((c) => c.salonId),
      ];
      if (!allSalonIds.includes(salonId)) {
        return NextResponse.json({ error: 'Accesso negato' }, { status: 403 });
      }
    }
```

with:

```typescript
    const callerIsSuperAdmin = await isSuperAdmin(user.id);

    if (callerIsSuperAdmin) {
      // Super-admins must go through /api/platform/enter-salon to change their
      // active salon — that route writes the super_admin_impersonation row
      // atomically. set-salon is a blunt cookie-writer and would leave the
      // table out of sync with the cookie.
      return NextResponse.json(
        { error: 'I super-admin devono usare /api/platform/enter-salon' },
        { status: 403 },
      );
    }

    const workspace = await resolveWorkspace(user.id);
    const allSalonIds = [
      ...workspace.businessContexts.map((c) => c.salonId),
      ...workspace.clientContexts.map((c) => c.salonId),
    ];
    if (!allSalonIds.includes(salonId)) {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 });
    }
```

- [ ] **Step 3: Audit callers of set-salon for super-admin paths**

Run:
```bash
grep -rn "gateway/set-salon" src/
```
Expected call sites (pre-existing):
- `src/lib/stores/workspace.ts` — `resolve()` re-writes the cookie after `/api/gateway` returns an `activeSalonId`
- `src/lib/stores/workspace.ts` — `setActiveSalon()` for user-initiated salon switch (select-salon page)

The `resolve()` re-write is now redundant for super-admins because Task 6's `resolveWorkspace` resyncs cookies directly. To avoid the 403 from Step 2, guard the re-write:

Open `src/lib/stores/workspace.ts`. Locate:
```typescript
    if (result.activeSalonId) {
      await fetch('/api/gateway/set-salon', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ salonId: result.activeSalonId }),
      });
    }
```

Replace with:
```typescript
    // Non-super-admin multi-salon users persist their choice here. For
    // super-admins the gateway itself resyncs the cookie from the
    // super_admin_impersonation table, so skip this call.
    if (result.activeSalonId && !result.isSuperAdmin) {
      await fetch('/api/gateway/set-salon', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ salonId: result.activeSalonId }),
      });
    }
```

- [ ] **Step 4: Typecheck + lint**

Run:
```bash
npm run check
```
Expected: no errors.

- [ ] **Step 5: Manual verify — set-salon rejects super-admins**

With longoa02 logged in (impersonation active), open browser devtools console and run:
```javascript
fetch('/api/gateway/set-salon', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ salonId: 'd368d644-c99b-4c45-8b04-b11891cae20b' }),
}).then(r => r.status).then(console.log);
```
Expected: `403`.

- [ ] **Step 6: Manual verify — multi-salon non-super-admin flow still works**

This one is harder to verify without a test non-super-admin multi-salon user. If such a user exists in staging/local, log in as them and confirm the `/select-salon` page switches salons correctly. Otherwise flag this as a follow-up manual check.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/gateway/set-salon/route.ts src/lib/stores/workspace.ts
git commit -m "refactor(impersonation): super-admins must use enter-salon, not set-salon"
```

---

## Task 8: End-to-end verification with the failing scenario from the original bug

**Goal:** Prove the original bug is fixed and impersonation now works end-to-end.

- [ ] **Step 1: Reset to a clean state**

Via MCP:
```sql
DELETE FROM public.super_admin_impersonation
WHERE user_id = 'd3ab9dd0-292d-42b3-a31f-7304fe103ef9';
```
Expected: 0 or 1 rows affected.

In the browser, clear the cookies `lume-active-salon-id` and `lume-impersonating` for the dev origin.

- [ ] **Step 2: Verify non-impersonating super-admin sees their own salon**

Log in as longoa02. Land on `/platform`. Navigate to `/admin/operatori` directly (bypassing the platform switcher).

Sidebar should read: **Dacci un Taglio**.
Operators list should contain: Alessandro Longo, Tizio Rossi, Caio Verdi.

Via MCP, confirm no impersonation row:
```sql
SELECT count(*) FROM public.super_admin_impersonation
WHERE user_id = 'd3ab9dd0-292d-42b3-a31f-7304fe103ef9';
```
Expected: `0`.

- [ ] **Step 3: Enter impersonation for Sinergia**

Go to `/platform/salons`, click Enter on Sinergia Della Bellezza.

After redirect to `/admin/calendario`:
- Sidebar reads: **Sinergia Della Bellezza**
- ImpersonationBanner is visible at the top with "Torna alla piattaforma"

Navigate to `/admin/operatori`. Operators list should be:
- **Laura Spada**
- **Mario Spada**

This is the critical assertion: **operators list now matches the impersonated salon**. Before this plan, it would have shown the super-admin's own salon's operators.

Via MCP, confirm the row:
```sql
SELECT salon_id FROM public.super_admin_impersonation
WHERE user_id = 'd3ab9dd0-292d-42b3-a31f-7304fe103ef9';
```
Expected: `d368d644-c99b-4c45-8b04-b11891cae20b`.

- [ ] **Step 4: Spot-check one more table to prove RLS-wide fix**

Still impersonating Sinergia, navigate to `/admin/clienti`. The clients list should be Sinergia's clients (whatever those happen to be), not Dacci un Taglio's. Cross-reference via MCP:

```sql
SELECT count(*) AS sinergia_clients
FROM public.clients
WHERE salon_id = 'd368d644-c99b-4c45-8b04-b11891cae20b'
  AND archived_at IS NULL;
```
The UI count and this count should match.

- [ ] **Step 5: Exit impersonation**

Click "Torna alla piattaforma" in the banner. Redirected to `/platform/salons`.

Navigate to `/admin/operatori`. Sidebar: **Dacci un Taglio**. Operators: Alessandro/Tizio/Caio.

Via MCP:
```sql
SELECT count(*) FROM public.super_admin_impersonation
WHERE user_id = 'd3ab9dd0-292d-42b3-a31f-7304fe103ef9';
```
Expected: `0`.

- [ ] **Step 6: Logout with impersonation active + re-login**

1. Re-enter impersonation for Sinergia.
2. Log out via the avatar menu. (This hits `/auth/logout`.)
3. Confirm no row: `SELECT count(*) FROM public.super_admin_impersonation WHERE user_id = 'd3ab9dd0-292d-42b3-a31f-7304fe103ef9';` → `0`.
4. Log back in. You should land on `/platform`, NOT auto-resume Sinergia impersonation.

- [ ] **Step 7: Final commit**

If no code changes are pending from verification:
```bash
git status
```
Expected: clean working tree (all task commits already landed).

---

## Rollback

If something goes wrong after deployment:

1. **Revert the code commits** via `git revert <sha>`. The `super_admin_impersonation` table can remain — it's unused by reverted code.
2. **Restore the original `get_user_salon_id()`** via:
   ```sql
   CREATE OR REPLACE FUNCTION public.get_user_salon_id()
   RETURNS uuid
   LANGUAGE sql
   STABLE
   AS $$
     SELECT salon_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
   $$;
   ```
3. **Optional cleanup** of the table once all code that references it is gone:
   ```sql
   DROP TABLE public.super_admin_impersonation;
   ```

---

## Post-completion notes

- The `lume-impersonating` cookie is now redundant with `isSuperAdmin + table row`. Consider removing it in a follow-up and deriving banner visibility from the `/api/subscription` response (add an `isImpersonating` boolean to the payload). Out of scope here because it requires coordinating with every place that reads the cookie client-side.
- This plan addresses *RLS correctness* during impersonation. It does not address *audit logging* (who impersonated whom, when). If needed, add a trigger on `super_admin_impersonation` that inserts into an audit log table.
- Realtime subscriptions (`useRealtimeStore`) already filter by `activeSalonId` from the workspace store, which now comes from the table. No additional work needed.
