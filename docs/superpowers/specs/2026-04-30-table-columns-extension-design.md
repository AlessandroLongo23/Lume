# Extending admin tables with stats columns + column-visibility analytics

**Date:** 2026-04-30
**Status:** Spec — pending implementation plan
**Related prior work:** Clients table was extended with `total_spent`, `visit_count`, `avg_ticket`, `first_visit`, `last_visit`, `top_service`, `top_operator` (commit 2f3db30). This spec generalises that pattern to the remaining major tables.

## Goal

Extend the **Services**, **Products (magazzino)**, and **Operators** tables with richer informational columns — both direct fields already on the model and derived statistics computed from `fiches` / `fiche_services` / `fiche_products`. Add a platform-admin-only analytics page that aggregates the existing column-visibility preferences across all users to learn which columns customers actually find useful.

## Non-goals

- No changes to the public landing page or marketing surfaces.
- No new tracking pipeline. Column analytics reuses the existing `profiles.preferences.tableColumns` data.
- No client-side caching layer beyond what the existing `*_stats` stores already do.
- "Effective duration" (services), "utilization %" / "no-show rate" / "client retention rate" (operators), and "days of stock left" (products) are flagged as deferred — not in scope here.

## Architectural pattern (existing, to be mirrored)

The clients table established the convention. Each derived-stats column follows this stack:

1. **Supabase view** named `<entity>_stats` returning one row per entity id with aggregated metrics.
2. **TypeScript class** in `src/lib/types/<Entity>Stat.ts` with a `RawXStat` interface and a constructor that parses string numerics → numbers and ISO timestamps → `Date`.
3. **Zustand store** in `src/lib/stores/<entity>_stats.ts` exposing `stats: Record<id, XStat>`, `isLoading`, `error`, `fetchXStats()`, where the body is a one-shot `supabase.from('<entity>_stats').select('*')`.
4. **Table component** consumes the store via `useXStatsStore((s) => s.stats)`, joins by id inside `accessorFn`, and renders cells with `formatCurrency`, `tabular-nums`, and existing zinc/indigo styling.

Direct-field columns skip steps 1–3 and read straight off the entity model.

## Part 1 — Services table

### Direct columns (no DB work)

- **Margine** — `service.price − service.product_cost`, formatted as currency.

### Derived columns (`service_stats` view)

Aggregated from `fiche_services` (no fiche-status filter — every recorded `fiche_services` row counts; the salon may add status filtering later if needed).

| Column | SQL |
|---|---|
| `service_id` | grouping key |
| `salon_id` | from any row (all rows for a service share salon_id) |
| `total_count` | `count(*)` |
| `total_revenue` | `sum(final_price)` |
| `avg_price` | `avg(final_price)` |
| `last_performed` | `max(start_time)` |
| `top_operator_id` | operator with the most `fiche_services` rows for this service |
| `top_operator_name` | denormalised first/last name string |

UI columns added (in this order, after existing `Costo prodotti`):

- Volte eseguito (tabular nums)
- Ricavo totale (currency)
- Prezzo medio applicato (currency, em-dash if no rows)
- Ultima esecuzione (Italian date, em-dash if no rows)
- Operatore top (truncate-2-words, em-dash if no rows)
- Margine (currency, computed from model — placed last)

## Part 2 — Products (magazzino) table

### Direct columns (zero backend, ship first)

All fields already exist on the `Product` model. Add as columns:

- **Quantità (ml)** — `quantity_ml`, em-dash when null
- **Vendibile al pubblico** — `is_for_retail`, render as a small zinc/indigo badge ("Sì" / em-dash)
- **Prezzo vendita** — `sell_price`, currency, em-dash when null or `is_for_retail` is false
- **Giacenza** — `stock_quantity`, tabular-nums, with conditional styling:
  - red when `stock_quantity ≤ min_threshold`
  - amber when `stock_quantity ≤ min_threshold * 1.5`
  - default (zinc) otherwise
- **Soglia minima** — `min_threshold`, tabular-nums
- **Margine unitario** — `sell_price − price` when `is_for_retail` and `sell_price` set; em-dash otherwise

### Derived columns (`product_stats` view)

Confirmed: `fiche_products` represents retail sales only — no product-consumption rows.

| Column | SQL |
|---|---|
| `product_id` | grouping key |
| `salon_id` | from any row |
| `units_sold` | `sum(quantity)` from `fiche_products` |
| `total_revenue` | `sum(final_price)` from `fiche_products` |
| `last_sold` | `max(fiches.datetime)` joined via `fiche_id` |

UI columns added:

- Unità vendute (tabular nums)
- Ricavo retail (currency)
- Ultima vendita (Italian date, em-dash if never sold)

"Ultimo carico" (last restock) is **not** included in this iteration — `orders` does not have a confirmed line-items linkage to `products` from inspection of `Order.ts`; would need a separate investigation.

## Part 3 — Operators table

### Derived columns (`operator_stats` view)

Aggregated from `fiche_services` joined to `fiches` (for `client_id` and the canonical fiche datetime).

| Column | SQL |
|---|---|
| `operator_id` | grouping key |
| `salon_id` | from any row |
| `fiche_count` | `count(distinct fiche_id)` |
| `total_revenue` | `sum(final_price)` |
| `avg_ticket` | `total_revenue / NULLIF(fiche_count, 0)` |
| `unique_clients` | `count(distinct fiches.client_id)` |
| `top_service_id` | service with the most `fiche_services` rows for this operator |
| `top_service_name` | denormalised name |
| `last_fiche_at` | `max(start_time)` |

UI columns added (after existing Telefono):

- Fiche completate (tabular nums)
- Ricavo generato (currency)
- Scontrino medio (currency)
- Clienti unici (tabular nums)
- Servizio top (truncated)
- Ultima fiche (Italian date with "Xg fa" suffix, mirroring the clients table's last-visit cell)

### Deferred to follow-up work

- Utilizzo % — requires reconciling `fiche_services` durations with the per-operator `working_hours` schedule (newly landed in commit 59e5a51) and the salon-level operating hours fallback. Worth its own design pass.
- Tasso fidelizzazione (% of operator's clients who book a 2nd time with the same operator).
- Tasso no-show / cancellazioni — depends on whether fiche cancellation states are tracked granularly enough.

## Part 4 — Column-visibility analytics (platform admin)

### Why this is essentially free

Column preferences are already stored DB-side at `profiles.preferences.tableColumns[<tableId>] = { order: string[], hidden: string[] }`. No new tracking or events needed — the existing data is the dataset.

### Data shape

For each `(tableId, columnId)` pair we want:

- `total_users` — how many users have any prefs for this table
- `hidden_count` — users who explicitly hid this column
- `visible_count` — `total_users − hidden_count` (a column not listed in `hidden` is visible by default)
- `visible_rate` — `visible_count / total_users`
- `avg_position` — average index of the column in the user's `order` array (NaN if no users have ordered it)

A column not appearing in any user's `hidden` array is implicitly visible for everyone — that's the meaningful default. The set of valid column IDs per table is hard-coded on the frontend (it's already implicit in each table component) and passed to the aggregation endpoint.

### Implementation

**Server**: a new route `app/api/platform/column-stats/route.ts` (auth-gated to `role = 'admin'`) that accepts a body of `{ tableId, knownColumnIds: string[] }`. The handler runs a single query against `profiles` filtering for `preferences->'tableColumns'->tableId IS NOT NULL`, then computes counts in JS — the dataset is small enough (one row per user) that pulling it into the API process is fine, and SQL with `jsonb_array_elements_text` would be more error-prone than worth.

**UI**: `app/platform/analytics/columns/page.tsx` — a horizontal-bar visualisation per table showing visibility rate (0–100%) for each column, sorted descending. One section per known table (clients, services, products, operators). Restricted to platform admins by the platform layout's existing role check.

This is the lowest priority of the five stages — it ships last.

## Phasing

Each stage is a self-contained PR.

1. **Services stats** — mirror of the clients work; lowest risk, validates the pattern still holds.
2. **Operators stats** — highest immediate user value (salon owners pay attention to operator productivity).
3. **Products direct fields** — pure UI work, zero schema changes.
4. **Products derived stats** — `product_stats` view + columns.
5. **Column analytics** — platform admin tool.

## Files touched (preliminary)

Per stats stage:

- `src/lib/types/<Entity>Stat.ts` (new)
- `src/lib/stores/<entity>_stats.ts` (new)
- `src/lib/components/admin/<entity>/<Entity>Table.tsx` (or the relevant tab component for products and services)
- `src/app/admin/<entity>/page.tsx` — call `fetchXStats` alongside the existing fetches
- New Supabase view (created via `mcp__supabase__apply_migration`)

For column analytics:

- `src/app/api/platform/column-stats/route.ts` (new)
- `src/app/platform/analytics/columns/page.tsx` (new)
- A new shared horizontal-bar visual component, or reuse an existing one if there is one in `lib/components/graphs/`

## Open items / risks

- **Service stats: status filtering** — every `fiche_services` row currently counts. If a salon cancels appointments without removing the rows, that pollutes "volte eseguito". Worth a sanity check against real data once shipped, but not a blocker.
- **Top-operator / top-service tie-breaking** — when two operators have the same row count, the view will pick one nondeterministically (whichever the planner returns first). Acceptable for a "top" column, but worth a stable secondary sort (e.g. operator id) to avoid flapping between fetches.
- **Avg-position metric in column analytics** — only meaningful for users who have explicitly reordered columns. Most users won't, and they'll all have the same default order. Probably show only `visible_rate` in v1 and leave order analysis for later.
- **Realtime invalidation of `*_stats`** — current `client_stats` does NOT auto-refresh when fiches change. The other stats stores will inherit that limitation. Not addressed here; flagged for a future improvement.
