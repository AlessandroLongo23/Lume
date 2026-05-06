# Design: `is_test` flag on salons

**Date:** 2026-05-06

## Problem

Test salons (used for development/QA) are mixed into platform metrics, inflating signup counts, GMV, and subscription status charts. They should be excluded from all metrics while still being manageable from the salons list.

## Database

**Migration (applied via Supabase MCP):**
```sql
ALTER TABLE salons ADD COLUMN is_test boolean NOT NULL DEFAULT false;
UPDATE salons SET is_test = true WHERE name ILIKE '%test%';
```

No RLS changes needed — `is_test` is a platform-admin concern and the salons table is already unprotected for admins.

## Metrics page (`src/app/platform/metrics/page.tsx`)

- Add `is_test` to the `SalonRow` type and the `.select(...)` query.
- In `computeMetrics`, derive `realSalons = salons.filter(s => !s.is_test)` at the top and replace every use of `salons` (status counts, MRR, ARR, paying trend, signups, monthly breakdown, trials-ending, recent signups) with `realSalons`.
- For GMV and top-salons, build a `Set<string>` of test salon IDs and skip `fiche_services` rows that belong to them.
- `totalSalons` in the returned data reflects only real salons.

## Salons list page (`src/app/platform/salons/page.tsx`)

- Add `is_test` to the `SalonRow` type and the `.select(...)` query.
- Pass `isTest: boolean` through `SalonCardRow`.

## `SalonCard` component (`src/lib/components/platform/SalonCard.tsx`)

**Visual indicator:**
- When `row.isTest === true`, show a small muted chip — e.g. `"Test"` in zinc style — next to the salon name. Not an accent color; it's informational, not a status.

**Toggle action (with confirmation):**
- Add "Segna come test" / "Rimuovi da test" to the `⋮` dropdown, below Rinomina, above Elimina.
- Clicking opens an inline confirmation step within the dropdown (two buttons: confirm + cancel), similar to the rename pattern but modal-free.
- On confirm: `PATCH /api/platform/salons/[id]` with `{ is_test: boolean }` → `router.refresh()`.

## API (`src/app/api/platform/salons/[id]/route.ts`)

- Extend the existing `PATCH` handler to accept `is_test: boolean` in the body alongside `name`.
- Only one field needs to be present; the handler applies whichever is provided.

## Salon type (`src/lib/types/Salon.ts`)

- Add `is_test: boolean` to the `Salon` interface.

## Out of scope

- Filtering test salons from the salons *list* page (they should still appear so admins can manage them).
- Any RLS or tenant-level changes.
- Backfill beyond the two salons with "test" in their name.
