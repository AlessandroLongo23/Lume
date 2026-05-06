# `is_test` Salon Flag — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `is_test` boolean column to `salons`, flag the two existing test salons, exclude them from all platform metrics, and expose a confirmed toggle in the salons-list card's action menu.

**Architecture:** Single DB migration adds the column; the metrics page filters before computing any aggregate; the salons list page passes the flag down to `SalonCard`, which renders a chip and an inline-confirmed action menu item.

**Tech Stack:** Supabase (MCP migration), Next.js App Router, TypeScript, React, Tailwind CSS v4

---

## File Map

| Action   | File                                                                 | Change |
|----------|----------------------------------------------------------------------|--------|
| Modify   | `src/lib/types/Salon.ts`                                             | Add `is_test: boolean` |
| Modify   | `src/app/api/platform/salons/[id]/route.ts`                          | Extend PATCH to accept `is_test` |
| Modify   | `src/app/platform/metrics/page.tsx`                                  | Filter test salons from all metrics |
| Modify   | `src/app/platform/salons/page.tsx`                                   | Add `is_test` to query + `SalonCardRow` |
| Modify   | `src/lib/components/platform/SalonCard.tsx`                          | Add chip + confirmed toggle |

---

## Task 1: DB migration — add column and flag existing test salons

**Files:**
- Apply via Supabase MCP (no local file created)

- [ ] **Step 1: Run the migration**

Execute these two SQL statements via the Supabase MCP `execute_sql` tool (or the Supabase dashboard SQL editor):

```sql
ALTER TABLE salons ADD COLUMN is_test boolean NOT NULL DEFAULT false;
UPDATE salons SET is_test = true WHERE name ILIKE '%test%';
```

- [ ] **Step 2: Verify**

Run:
```sql
SELECT id, name, is_test FROM salons ORDER BY is_test DESC, name;
```

Expected: rows whose names contain "test" (case-insensitive) show `is_test = true`; all others show `false`.

- [ ] **Step 3: Commit**

```bash
git commit --allow-empty -m "db: add is_test column to salons, flag test salons"
```

---

## Task 2: Update `Salon` type

**Files:**
- Modify: `src/lib/types/Salon.ts`

- [ ] **Step 1: Add `is_test` field**

In `src/lib/types/Salon.ts`, add one line to the `Salon` interface after `onboarding_dismissed_at`:

```typescript
  // Platform
  is_test:                 boolean;
```

Full interface tail after the edit:

```typescript
  // Onboarding bulk import
  onboarded_at:            string | null;
  onboarding_dismissed_at: string | null;
  // Platform
  is_test:                 boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types/Salon.ts
git commit -m "types: add is_test to Salon interface"
```

---

## Task 3: Extend PATCH API route to accept `is_test`

**Files:**
- Modify: `src/app/api/platform/salons/[id]/route.ts:13-33`

The current handler rejects the request if `name` is missing. We need it to handle either `name` or `is_test` (or both).

- [ ] **Step 1: Replace the PATCH handler body**

Replace lines 13–33 (the entire `PATCH` function) with:

```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const patch: Record<string, unknown> = {};
  if (typeof body.name === 'string') {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: 'Nome mancante' }, { status: 400 });
    patch.name = name;
  }
  if (typeof body.is_test === 'boolean') {
    patch.is_test = body.is_test;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nessun campo da aggiornare' }, { status: 400 });
  }

  const supabaseAdmin = getAdminClient();
  const { error } = await supabaseAdmin.from('salons').update(patch).eq('id', id);
  if (error) {
    console.error('Platform salon update failed:', error);
    return NextResponse.json({ error: 'Aggiornamento fallito' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Run lint to verify**

```bash
npm run lint -- --max-warnings=0 src/app/api/platform/salons/\\[id\\]/route.ts
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/platform/salons/\[id\]/route.ts
git commit -m "api: extend platform salon PATCH to accept is_test"
```

---

## Task 4: Filter test salons from metrics

**Files:**
- Modify: `src/app/platform/metrics/page.tsx`

- [ ] **Step 1: Add `is_test` to `SalonRow` type and query**

Change the `SalonRow` type (lines 16–25) to:

```typescript
type SalonRow = {
  id:                   string;
  name:                 string;
  logo_url:             string | null;
  subscription_status:  string;
  subscription_plan:    string | null;
  trial_ends_at:        string;
  subscription_ends_at: string | null;
  created_at:           string;
  is_test:              boolean;
};
```

Change the `.select(...)` string in the query (line 44) to:

```typescript
      .select('id, name, logo_url, subscription_status, subscription_plan, trial_ends_at, subscription_ends_at, created_at, is_test')
```

- [ ] **Step 2: Filter test salons at the top of `computeMetrics`**

At line 71, right after the function signature and opening brace of `computeMetrics`, add:

```typescript
  const realSalons      = salons.filter((s) => !s.is_test);
  const testSalonIds    = new Set(salons.filter((s) => s.is_test).map((s) => s.id));
  const realFicheServices = ficheServices.filter((f) => !testSalonIds.has(f.salon_id));
```

- [ ] **Step 3: Replace all uses of `salons` and `ficheServices` in the function body**

After the three lines you just added, every reference to the `salons` parameter and the `ficheServices` parameter must use `realSalons` / `realFicheServices` instead. Apply these changes:

**Status + plan counts (line ~76):**
```typescript
  for (const s of realSalons) {
```

**activeSalons (line ~80):**
```typescript
  const activeSalons = realSalons.filter((s) => s.subscription_status === 'active');
```

**Signups 30d (line ~101):**
```typescript
  const signups30 = realSalons.filter((s) => new Date(s.created_at) >= day30Ago).length;
  const signupsPrev = realSalons.filter((s) => {
```

**Monthly signups — cumulative seed (line ~112):**
```typescript
  let cumulative = realSalons.filter((s) =>
    new Date(s.created_at) < new Date(now.getFullYear(), now.getMonth() - 5, 1),
  ).length;
```

**Monthly signups — inner loop (line ~118):**
```typescript
    const ms = realSalons.filter((s) => {
```

**GMV iteration (line ~134):**
```typescript
  for (const f of realFicheServices) {
```

**Revenue by salon map (line ~143):**
```typescript
  for (const f of realFicheServices) {
```

**salonById map (line ~148):**
```typescript
  const salonById = new Map(realSalons.map((s) => [s.id, s]));
```

**Trials ending (line ~164):**
```typescript
  const trialsEnding = realSalons
```

**Recent signups (line ~177):**
```typescript
  const recentSignups = [...realSalons]
```

**totalSalons in return (line ~199):**
```typescript
    totalSalons: realSalons.length,
```

- [ ] **Step 4: Run lint**

```bash
npm run lint -- --max-warnings=0 src/app/platform/metrics/page.tsx
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/platform/metrics/page.tsx
git commit -m "feat: exclude is_test salons from platform metrics"
```

---

## Task 5: Pass `is_test` through salons list page

**Files:**
- Modify: `src/app/platform/salons/page.tsx`
- Modify: `src/lib/components/platform/SalonCard.tsx` (type only in this task)

- [ ] **Step 1: Add `is_test` to `SalonRow` type and query in `salons/page.tsx`**

Change the `SalonRow` type (lines 16–26):

```typescript
type SalonRow = {
  id:                   string;
  name:                 string;
  owner_id:             string;
  trial_ends_at:        string;
  created_at:           string;
  subscription_status:  string;
  subscription_plan:    string | null;
  subscription_ends_at: string | null;
  logo_url:             string | null;
  is_test:              boolean;
};
```

Change the `.select(...)` string (line 35):

```typescript
    .select('id, name, owner_id, trial_ends_at, created_at, subscription_status, subscription_plan, subscription_ends_at, logo_url, is_test')
```

- [ ] **Step 2: Add `isTest` to the `rows` mapping (line ~88)**

In the `.map((s) => ({ ... }))` block that builds `rows`, add:

```typescript
      isTest:               s.is_test,
```

The full mapped object becomes:

```typescript
  const rows: SalonCardRow[] = (salons ?? []).map((s) => {
    const owner = ownerById.get(s.owner_id);
    return {
      id:                   s.id,
      name:                 s.name,
      logoUrl:              s.logo_url,
      ownerEmail:           owner?.email ?? '—',
      ownerName:            owner ? `${owner.first_name} ${owner.last_name}`.trim() : '',
      subscriptionStatus:   s.subscription_status,
      subscriptionPlan:     s.subscription_plan,
      subscriptionEndsAt:   s.subscription_ends_at,
      trialEndsAt:          s.trial_ends_at,
      createdAt:            s.created_at,
      clientsCount:         clientsBySalon.get(s.id) ?? 0,
      fichesThisMonth:      fichesThisMonthBySalon.get(s.id) ?? 0,
      revenueThisMonth:     revenueBySalon.get(s.id) ?? 0,
      isTest:               s.is_test,
    };
  });
```

- [ ] **Step 3: Add `isTest` to `SalonCardRow` type in `SalonCard.tsx`**

In `src/lib/components/platform/SalonCard.tsx`, add one line to the `SalonCardRow` type (after `revenueThisMonth`):

```typescript
export type SalonCardRow = {
  id:                 string;
  name:               string;
  logoUrl:            string | null;
  ownerEmail:         string;
  ownerName:          string;
  subscriptionStatus: string;
  subscriptionPlan:   string | null;
  subscriptionEndsAt: string | null;
  trialEndsAt:        string;
  createdAt:          string;
  clientsCount:       number;
  fichesThisMonth:    number;
  revenueThisMonth:   number;
  isTest:             boolean;
};
```

- [ ] **Step 4: Run lint**

```bash
npm run lint -- --max-warnings=0 src/app/platform/salons/page.tsx src/lib/components/platform/SalonCard.tsx
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/platform/salons/page.tsx src/lib/components/platform/SalonCard.tsx
git commit -m "feat: pass is_test from salons list page to SalonCard"
```

---

## Task 6: SalonCard — test chip + confirmed toggle

**Files:**
- Modify: `src/lib/components/platform/SalonCard.tsx`

- [ ] **Step 1: Add `FlaskConical` to the lucide-react import**

Change the import line at the top of the file:

```typescript
import { ArrowRight, MoreVertical, Pencil, Trash2, Users, Ticket, Euro, FlaskConical } from 'lucide-react';
```

- [ ] **Step 2: Add `confirmTestToggle` state**

In the `SalonCard` component body, alongside the existing `useState` calls, add:

```typescript
  const [confirmTestToggle, setConfirmTestToggle] = useState(false);
```

- [ ] **Step 3: Add the "Test" chip next to the salon name**

The salon name is rendered inside `<p className="text-sm font-semibold ...">`. Wrap the name element and add the chip:

Replace:
```tsx
            ) : (
              <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white truncate">
                {row.name}
              </p>
            )}
```

With:
```tsx
            ) : (
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white truncate">
                  {row.name}
                </p>
                {row.isTest && (
                  <span className="shrink-0 flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                    <FlaskConical className="size-2.5" />
                    Test
                  </span>
                )}
              </div>
            )}
```

- [ ] **Step 4: Add the toggle item + confirmation UI to the `⋮` dropdown**

The dropdown currently contains Rinomina and Elimina. Add the test toggle between them. Replace the entire dropdown contents (the `<div className="absolute right-0 top-8 ...">` block and its children) with:

```tsx
              <div className="absolute right-0 top-8 z-dropdown w-48 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg py-1">
                <button
                  type="button"
                  onClick={() => { setIsRenaming(true); setMenuOpen(false); setConfirmTestToggle(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Pencil className="w-4 h-4" /> Rinomina
                </button>

                {confirmTestToggle ? (
                  <div className="px-3 py-2 flex flex-col gap-2">
                    <p className="text-xs text-zinc-600 dark:text-zinc-300">
                      {row.isTest ? 'Rimuovere il flag di test?' : 'Segnare come salone di test?'}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setConfirmTestToggle(false);
                          setMenuOpen(false);
                          await fetch(`/api/platform/salons/${row.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ is_test: !row.isTest }),
                          });
                          router.refresh();
                        }}
                        className="flex-1 text-xs px-2 py-1 rounded bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100"
                      >
                        Conferma
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmTestToggle(false)}
                        className="flex-1 text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmTestToggle(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <FlaskConical className="w-4 h-4" />
                    {row.isTest ? 'Rimuovi da test' : 'Segna come test'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => { setDeleteModalOpen(true); setMenuOpen(false); setConfirmTestToggle(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="w-4 h-4" /> Elimina
                </button>
              </div>
```

Also update the backdrop `<button>` that closes the menu to also reset confirmation state:

```tsx
              <button
                type="button"
                aria-label="Chiudi menu"
                className="fixed inset-0"
                onClick={() => { setMenuOpen(false); setConfirmTestToggle(false); }}
              />
```

- [ ] **Step 5: Run lint**

```bash
npm run lint -- --max-warnings=0 src/lib/components/platform/SalonCard.tsx
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/platform/SalonCard.tsx
git commit -m "feat: add is_test chip and confirmed toggle to SalonCard"
```

---

## Task 7: Full check

- [ ] **Step 1: Run full type + lint check**

```bash
npm run check
```

Expected: no TypeScript errors, no ESLint errors.

- [ ] **Step 2: Manual smoke test**

1. Open `http://localhost:3000/platform/salons` — verify test salons show the "Test" chip next to their name.
2. Open the `⋮` menu on a non-test salon → click "Segna come test" → confirm → chip appears, page refreshes.
3. Open the `⋮` menu on a test salon → click "Rimuovi da test" → confirm → chip disappears.
4. Open `http://localhost:3000/platform/metrics` — verify test salon signups are not counted and their revenue does not appear in top salons or GMV.
