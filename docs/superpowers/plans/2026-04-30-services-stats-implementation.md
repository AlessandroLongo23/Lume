# Services Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-service stats columns (volte eseguito, ricavo totale, prezzo medio applicato, ultima esecuzione, operatore top, margine) to the Services table by mirroring the established `client_stats` pattern.

**Architecture:** New `service_stats` Supabase view aggregating `fiche_services` → matching `ServiceStat` TypeScript class → Zustand `useServiceStatsStore` → `ServicesTable.tsx` joins by `service_id` at render time. The existing inefficient client-side `usageCounts` aggregation in `app/admin/servizi/page.tsx` is removed in favor of the view.

**Tech Stack:** Next.js 16, Supabase (Postgres views, RLS via `security_invoker`), TypeScript, Zustand, TanStack Table v8, Tailwind CSS v4.

**Reference spec:** [docs/superpowers/specs/2026-04-30-table-columns-extension-design.md](../specs/2026-04-30-table-columns-extension-design.md)

**Project conventions worth knowing:**
- No automated tests in this repo. Verification is `npm run check` (tsc + eslint) plus manual browser walkthrough.
- Path alias `@/*` → `./src/*`.
- Italian-locale UI throughout.
- Currency: `formatCurrency` in `src/lib/utils/format.ts`.
- All numeric cells use `tabular-nums`. Numeric columns are right-aligned (the `ServicesTable.tsx` header logic already detects column ids — extend that detection).

---

## File map

**New files:**
- `src/lib/types/ServiceStat.ts` — class + raw interface, mirrors `ClientStat.ts`
- `src/lib/stores/service_stats.ts` — Zustand store, mirrors `client_stats.ts`

**Modified files:**
- `src/app/admin/servizi/page.tsx` — drop the in-page `usageCounts` `useEffect`/state, fetch service stats on mount instead; stop passing `usageCounts` prop
- `src/lib/components/admin/services/ServicesTable.tsx` — drop `usageCounts` prop, replace `usage_count` column with stats-driven columns, add 5 new derived columns + 1 client-side margin column, extend right-align detection

**Database (applied via `mcp__supabase__apply_migration`):**
- New view `public.service_stats`

---

## Task 1: Verify existing schema and `client_stats` definition

**Files:** none (read-only investigation)

This task locks in the exact column names and the SQL shape we mirror. Don't skip — the rest of the plan assumes findings here.

- [ ] **Step 1.1: Query `operators` columns**

Use `mcp__supabase__execute_sql`:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'operators'
ORDER BY ordinal_position;
```

Expected: confirm whether the names are `first_name`/`last_name` (snake_case) or `firstName`/`lastName` (camelCase). The TypeScript `Operator` class uses camelCase but DB columns may differ — Supabase returns whatever the schema actually has.

- [ ] **Step 1.2: Query `fiche_services` columns**

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'fiche_services'
ORDER BY ordinal_position;
```

Expected: confirm `service_id`, `operator_id`, `salon_id`, `final_price`, `start_time` exist with the names used below.

- [ ] **Step 1.3: Query `services` columns**

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'services'
ORDER BY ordinal_position;
```

Expected: confirm `id`, `salon_id` exist.

- [ ] **Step 1.4: Read existing `client_stats` view source**

```sql
SELECT pg_get_viewdef('public.client_stats'::regclass, true);
```

Expected: a CREATE VIEW body. Compare it to the proposed `service_stats` SQL in Task 4 — if `client_stats` uses different conventions (e.g. `security_invoker` settings, schema qualification, GROUP BY style), match those conventions in the new view rather than diverging.

- [ ] **Step 1.5: Confirm RLS posture**

```sql
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN ('fiche_services', 'services', 'operators', 'client_stats');
```

Expected: tenant tables have `relrowsecurity = true`. The new view must inherit RLS from underlying tables — that's what `WITH (security_invoker = true)` in Postgres 15+ does. Verify `client_stats` was created the same way.

- [ ] **Step 1.6: Note any deviations**

If any of the assumed column names differ (e.g. operators uses `first_name` not `firstName`), update Tasks 2–4 below to match the actual schema before proceeding. **Do not invent column names — use what the DB has.**

No commit (research-only).

---

## Task 2: Create the `ServiceStat` class

**Files:**
- Create: `src/lib/types/ServiceStat.ts`

- [ ] **Step 2.1: Write `ServiceStat.ts`**

```typescript
export interface RawServiceStat {
  service_id: string;
  salon_id: string;
  total_count: number;
  total_revenue: number | string;
  avg_price: number | string;
  last_performed: string | null;
  top_operator_id: string | null;
  top_operator_name: string | null;
}

export class ServiceStat {
  service_id: string;
  salon_id: string;
  total_count: number;
  total_revenue: number;
  avg_price: number;
  last_performed: Date | null;
  top_operator_id: string | null;
  top_operator_name: string | null;

  constructor(raw: RawServiceStat) {
    this.service_id = raw.service_id;
    this.salon_id = raw.salon_id;
    this.total_count = raw.total_count;
    this.total_revenue =
      typeof raw.total_revenue === 'string' ? parseFloat(raw.total_revenue) : raw.total_revenue;
    this.avg_price =
      typeof raw.avg_price === 'string' ? parseFloat(raw.avg_price) : raw.avg_price;
    this.last_performed = raw.last_performed ? new Date(raw.last_performed) : null;
    this.top_operator_id = raw.top_operator_id;
    this.top_operator_name = raw.top_operator_name;
  }
}
```

Why string-or-number for the money fields: Postgres `numeric` types are returned as strings by `postgres-js`/Supabase. `ClientStat.ts:31` does the same parsing — keep the convention.

- [ ] **Step 2.2: Run typecheck**

```bash
npm run typecheck
```

Expected: pass.

- [ ] **Step 2.3: Commit**

```bash
git add src/lib/types/ServiceStat.ts
git commit -m "feat(services): add ServiceStat class for per-service aggregated metrics"
```

---

## Task 3: Create the `useServiceStatsStore` Zustand store

**Files:**
- Create: `src/lib/stores/service_stats.ts`

- [ ] **Step 3.1: Write `service_stats.ts`**

```typescript
import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { ServiceStat, type RawServiceStat } from '@/lib/types/ServiceStat';

interface ServiceStatsState {
  stats: Record<string, ServiceStat>;
  isLoading: boolean;
  error: string | null;
  fetchServiceStats: () => Promise<void>;
}

export const useServiceStatsStore = create<ServiceStatsState>((set) => ({
  stats: {},
  isLoading: true,
  error: null,

  fetchServiceStats: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('service_stats').select('*');
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    const stats: Record<string, ServiceStat> = {};
    for (const row of data as RawServiceStat[]) {
      const s = new ServiceStat(row);
      stats[s.service_id] = s;
    }
    set({ stats, isLoading: false, error: null });
  },
}));
```

This is byte-for-byte the shape of `client_stats.ts` with names changed. Keep it that way — the table component below depends on `stats` being a `Record<service_id, ServiceStat>`.

- [ ] **Step 3.2: Run typecheck**

```bash
npm run typecheck
```

Expected: pass.

- [ ] **Step 3.3: Commit**

```bash
git add src/lib/stores/service_stats.ts
git commit -m "feat(services): add useServiceStatsStore zustand store"
```

---

## Task 4: Create the `service_stats` Supabase view

**Files:** none locally. Migration applied via `mcp__supabase__apply_migration`.

- [ ] **Step 4.1: Reconcile column names**

Before applying, verify the SQL below uses the column names confirmed in Task 1. If the operators table uses `first_name`/`last_name` (snake_case), the SQL is already correct. If it uses `firstName`/`lastName` (camelCase, requiring quoted identifiers), rewrite the join target accordingly: `op."firstName" || ' ' || op."lastName"`.

- [ ] **Step 4.2: Apply the migration**

Use `mcp__supabase__apply_migration` with name `create_service_stats_view`:

```sql
CREATE OR REPLACE VIEW public.service_stats
WITH (security_invoker = true) AS
WITH per_operator AS (
  SELECT
    fs.service_id,
    fs.operator_id,
    op.first_name || ' ' || op.last_name AS operator_name,
    COUNT(*) AS rows_count,
    ROW_NUMBER() OVER (
      PARTITION BY fs.service_id
      ORDER BY COUNT(*) DESC, fs.operator_id ASC
    ) AS rnk
  FROM public.fiche_services fs
  JOIN public.operators op ON op.id = fs.operator_id
  WHERE fs.operator_id IS NOT NULL
  GROUP BY fs.service_id, fs.operator_id, op.first_name, op.last_name
),
top_op AS (
  SELECT service_id, operator_id, operator_name
  FROM per_operator
  WHERE rnk = 1
)
SELECT
  s.id AS service_id,
  s.salon_id,
  COUNT(fs.id)::int AS total_count,
  COALESCE(SUM(fs.final_price), 0)::numeric AS total_revenue,
  COALESCE(AVG(fs.final_price), 0)::numeric AS avg_price,
  MAX(fs.start_time) AS last_performed,
  top_op.operator_id AS top_operator_id,
  top_op.operator_name AS top_operator_name
FROM public.services s
LEFT JOIN public.fiche_services fs ON fs.service_id = s.id
LEFT JOIN top_op ON top_op.service_id = s.id
GROUP BY s.id, s.salon_id, top_op.operator_id, top_op.operator_name;
```

Why these decisions:
- `LEFT JOIN fiche_services` so services with zero usage still appear (with `total_count = 0`, sums coalesced to `0`, `last_performed = NULL`, top operator NULL).
- `ROW_NUMBER … ORDER BY COUNT(*) DESC, fs.operator_id ASC` — second sort key is the stable tie-breaker called out in the spec's "Open items" section.
- `security_invoker = true` so the view inherits RLS from `services`/`fiche_services` (mirroring how `client_stats` should be configured — verified in Task 1.5).
- Casts: explicit `::int` and `::numeric` keep the wire types matching what `ServiceStat`'s constructor expects.

- [ ] **Step 4.3: Sanity-check the view returns rows**

Use `mcp__supabase__execute_sql`:

```sql
SELECT
  service_id,
  total_count,
  total_revenue,
  avg_price,
  last_performed,
  top_operator_name
FROM public.service_stats
ORDER BY total_count DESC
LIMIT 5;
```

Expected: 5 rows. `total_count > 0` for at least one. `top_operator_name` is non-null when `total_count > 0` AND there are operator-attributed rows.

- [ ] **Step 4.4: Confirm a service with zero usage is included**

```sql
SELECT COUNT(*) FROM public.service_stats WHERE total_count = 0;
```

Expected: count > 0 if the dev DB has any never-performed services. Not a failure if zero — just confirms the LEFT JOIN behaves.

- [ ] **Step 4.5: Confirm RLS isolates correctly**

```sql
SELECT DISTINCT salon_id FROM public.service_stats;
```

If executed as a non-admin role, expected: only the caller's salon_id appears. As `service_role` (the Supabase MCP default), expected: all salons. The point is to confirm the view's `security_invoker` is wired — the actual isolation happens through the underlying tables' RLS at app runtime.

No git commit yet (DB-side change only).

---

## Task 5: Wire the store into the services page; remove old usage-count logic

**Files:**
- Modify: `src/app/admin/servizi/page.tsx`

- [ ] **Step 5.1: Import the new store**

At the top of the file, near the existing store imports (around line 5–7), add:

```typescript
import { useServiceStatsStore } from '@/lib/stores/service_stats';
```

- [ ] **Step 5.2: Replace the `usageCounts` state and effect**

The current page (lines 52, 59–83) maintains a hand-rolled `usageCounts: Map<string, number>` filled by paginating `fiche_services` client-side. Delete that whole block and replace with a single store call.

Remove these lines:

```typescript
const [usageCounts, setUsageCounts] = useState<Map<string, number>>(new Map());
```

Remove the entire `useEffect` block that builds `usageCounts` (currently lines 59–83).

In the existing fetch effect (lines 54–57), add the stats fetch:

```typescript
const fetchServiceStats = useServiceStatsStore((s) => s.fetchServiceStats);

useEffect(() => {
  fetchServices();
  fetchServiceCategories();
  fetchServiceStats();
}, [fetchServices, fetchServiceCategories, fetchServiceStats]);
```

- [ ] **Step 5.3: Remove the `usageCounts` prop from `<ServicesTable>`**

Find the `<ServicesTable services={visibleServices} showArchived={servicesShowArchived} usageCounts={usageCounts} />` usage (around line 240) and drop the `usageCounts` prop:

```tsx
<ServicesTable services={visibleServices} showArchived={servicesShowArchived} />
```

- [ ] **Step 5.4: Remove the now-unused `supabase` import**

The page imports `supabase` only to power the deleted `usageCounts` effect. Remove the import from the top of the file:

Before:
```typescript
import { supabase } from '@/lib/supabase/client';
```

(Delete that line.)

- [ ] **Step 5.5: Run check**

```bash
npm run check
```

Expected: pass. If TypeScript complains that `ServicesTable` still requires `usageCounts`, that's fine — the next task removes the prop.

- [ ] **Step 5.6: Commit**

```bash
git add src/app/admin/servizi/page.tsx
git commit -m "refactor(services): replace client-side usageCounts with service_stats store"
```

(The build is temporarily broken between this commit and Task 6's commit — that's acceptable for a linear local workflow. If preferred, defer this commit until after Task 6 and combine into one.)

---

## Task 6: Update `ServicesTable` to render the new columns

**Files:**
- Modify: `src/lib/components/admin/services/ServicesTable.tsx`

- [ ] **Step 6.1: Update imports**

Add to the lucide-react import at line 13:

```typescript
import {
  Search, X, ChevronUp, ChevronDown, SlidersHorizontal, Check, Trash2, ArchiveRestore
} from 'lucide-react';
```

(No new icons needed — the new columns reuse existing chevrons. Keep this line as-is unless a later step requires an icon.)

Add these imports below the existing imports (around line 24):

```typescript
import { useServiceStatsStore } from '@/lib/stores/service_stats';
import { formatCurrency } from '@/lib/utils/format';
```

- [ ] **Step 6.2: Drop the `usageCounts` prop**

Replace the props interface:

```typescript
interface ServicesTableProps {
  services: Service[];
  showArchived?: boolean;
}
```

Replace the function signature line:

```typescript
export function ServicesTable({ services, showArchived = false }: ServicesTableProps) {
```

- [ ] **Step 6.3: Read the stats store**

Inside the component body, near the existing `useServicesStore` calls (around line 37):

```typescript
const stats = useServiceStatsStore((s) => s.stats);
```

- [ ] **Step 6.4: Replace the `usage_count` column and add the five new derived columns + margin**

In the `columns = useMemo(...)` array (currently lines 87–138), keep `category_id`, `name`, `duration`, `price`, `product_cost` as-is. Then **delete** the existing `usage_count` column object (currently lines 128–135) and add the following column objects in this order at the end of the array:

```typescript
{
  id: 'total_count',
  header: () => <span className="block w-full text-right">Volte eseguito</span>,
  accessorFn: (row) => stats[row.id]?.total_count ?? 0,
  cell: ({ row }) => {
    const n = stats[row.original.id]?.total_count ?? 0;
    return <span className="block text-right tabular-nums">{n}</span>;
  },
},
{
  id: 'total_revenue',
  header: () => <span className="block w-full text-right">Ricavo totale</span>,
  accessorFn: (row) => stats[row.id]?.total_revenue ?? 0,
  cell: ({ row }) => {
    const v = stats[row.original.id]?.total_revenue ?? 0;
    return <span className="block text-right tabular-nums">{formatCurrency(v)}</span>;
  },
},
{
  id: 'avg_price',
  header: () => <span className="block w-full text-right">Prezzo medio</span>,
  accessorFn: (row) => stats[row.id]?.avg_price ?? 0,
  cell: ({ row }) => {
    const s = stats[row.original.id];
    if (!s || s.total_count === 0) {
      return <span className="block text-right text-zinc-400">—</span>;
    }
    return <span className="block text-right tabular-nums">{formatCurrency(s.avg_price)}</span>;
  },
},
{
  id: 'last_performed',
  header: 'Ultima esecuzione',
  accessorFn: (row) => stats[row.id]?.last_performed?.getTime() ?? 0,
  cell: ({ row }) => {
    const d = stats[row.original.id]?.last_performed;
    if (!d) return <span className="text-zinc-400">—</span>;
    return <span className="tabular-nums">{d.toLocaleDateString('it-IT')}</span>;
  },
},
{
  id: 'top_operator',
  header: 'Operatore top',
  accessorFn: (row) => stats[row.id]?.top_operator_name ?? '',
  sortingFn: (a, b) =>
    (stats[a.original.id]?.top_operator_name ?? '').localeCompare(
      stats[b.original.id]?.top_operator_name ?? '',
      'it'
    ),
  cell: ({ row }) => {
    const name = stats[row.original.id]?.top_operator_name;
    if (!name) return <span className="text-zinc-400">—</span>;
    return <span className="truncate max-w-[10rem] inline-block">{name}</span>;
  },
},
{
  id: 'margin',
  header: () => <span className="block w-full text-right">Margine</span>,
  accessorFn: (row) => row.price - row.product_cost,
  cell: ({ row }) => {
    const margin = row.original.price - row.original.product_cost;
    return <span className="block text-right tabular-nums">{formatCurrency(margin)}</span>;
  },
},
```

Update the `useMemo` deps array on the matching closing line (currently `[categories, usageCounts]`):

```typescript
}, [categories, stats]);
```

- [ ] **Step 6.5: Extend the right-align id detection**

The header (line 293) and cell (line 363) blocks both contain hard-coded `isNumeric` checks against column ids. Update both to include the new numeric column ids (`total_count`, `total_revenue`, `avg_price`, `margin` — `last_performed` is dates, left-aligned; `top_operator` is text). Replace the `usage_count` reference with the new ids.

Header check (line 293):

```typescript
const isNumeric =
  header.column.id === 'duration' ||
  header.column.id === 'price' ||
  header.column.id === 'product_cost' ||
  header.column.id === 'total_count' ||
  header.column.id === 'total_revenue' ||
  header.column.id === 'avg_price' ||
  header.column.id === 'margin';
```

Cell check (line 363):

```typescript
const isNumeric =
  cell.column.id === 'duration' ||
  cell.column.id === 'price' ||
  cell.column.id === 'product_cost' ||
  cell.column.id === 'total_count' ||
  cell.column.id === 'total_revenue' ||
  cell.column.id === 'avg_price' ||
  cell.column.id === 'margin';
```

(The two checks must stay in sync. Consider extracting to a `const NUMERIC_COLUMN_IDS = new Set([...])` at module scope to avoid drift — only do that if it doesn't conflict with surrounding patterns. If unsure, keep the two checks duplicated as the existing code already does.)

- [ ] **Step 6.6: Run check**

```bash
npm run check
```

Expected: pass. No TypeScript errors, no lint warnings.

- [ ] **Step 6.7: Manual browser verification**

In one terminal:

```bash
npm run dev
```

Navigate to `http://localhost:3000/admin/servizi`. Confirm:
- Existing columns (Categoria, Nome, Durata, Prezzo, Costo prodotti) still render.
- The new six columns appear: Volte eseguito, Ricavo totale, Prezzo medio, Ultima esecuzione, Operatore top, Margine.
- Numeric columns are right-aligned and use tabular figures.
- Services with zero historical usage show `0` for count/revenue, `—` for prezzo medio, ultima esecuzione, and operatore top.
- The Margine column shows `price − product_cost` for every row (including zero-usage services).
- Sorting by each new column works (click the header).
- The column picker (top-right of the toolbar) lists all new columns by their headers and lets you hide/show them.
- Refresh the page once: stats should still appear (the store fetches on mount).

If any column is empty across the board, the most likely cause is a wire-type mismatch between Postgres `numeric` and the `RawServiceStat` typing — re-check Task 2's `parseFloat` branches.

- [ ] **Step 6.8: Commit**

```bash
git add src/lib/components/admin/services/ServicesTable.tsx
git commit -m "feat(services): add stats columns (count, revenue, avg price, last, top operator, margin)"
```

---

## Task 7: Final integration check

**Files:** none.

- [ ] **Step 7.1: Run full check**

```bash
npm run check
```

Expected: pass cleanly.

- [ ] **Step 7.2: Verify column picker preferences round-trip**

In the browser, hide one of the new columns via the ColumnPicker. Reload the page. Confirm the column stays hidden — this proves the new column ids successfully integrate with the `tableColumns.services` preference shape stored on `profiles.preferences`. Re-show the column afterwards to leave the dev account in a clean state.

- [ ] **Step 7.3: Verify the page still works on a salon with zero fiches**

If a fresh tenant exists in the dev DB, switch to it (or create services on a tenant with no fiches). Confirm the table renders without errors and shows zeros / em-dashes — no console errors about undefined stats.

This is a behavioural guarantee specifically because the view uses `LEFT JOIN`. If a tenant has zero rows in `service_stats` at all (because they have no `services` either), the table simply has no rows — also fine.

- [ ] **Step 7.4: Commit any final cleanup**

If Step 7.2 or 7.3 surfaces issues, fix them and commit. Otherwise nothing to commit.

---

## Out of scope (deferred to follow-up plans, per the spec)

- Operators stats (separate plan).
- Products direct-field columns and product_stats (separate plans).
- Column-visibility analytics page on `/platform` (separate plan).
- Realtime invalidation of `service_stats` when fiches change (the view is fetched once on mount; data goes stale until next page load — acceptable for v1).
- "Effective duration" column for services (deferred per spec).

## Rollback

If the deployed view causes problems:

```sql
DROP VIEW IF EXISTS public.service_stats;
```

The frontend will then show empty `stats` (silent — `error.message` is captured into the store's `error` field but not displayed) and every stats column will read `0` / `—`. Revert the frontend commits (Tasks 5 and 6) for a full rollback.
