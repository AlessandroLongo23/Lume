---
name: tutorial-builder
description: Use when someone asks to build a tutorial, create a guide, add an interactive tour, or write a help-center article for a Lume feature. Triggers on "crea un tutorial", "build a tutorial for X", "create a guide for applying a discount", "aggiungi una guida interattiva", "fai il tutorial per …".
argument-hint: [topic, e.g. "applicare uno sconto a una fiche"] [optional: path to a video file]
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, AskUserQuestion, TodoWrite, mcp__supabase__execute_sql, mcp__supabase__list_tables, mcp__supabase__get_project_url, mcp__playwright__browser_navigate, mcp__playwright__browser_navigate_back, mcp__playwright__browser_resize, mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_fill_form, mcp__playwright__browser_press_key, mcp__playwright__browser_wait_for, mcp__playwright__browser_snapshot, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_evaluate, mcp__playwright__browser_close
---

## What this skill does

Generates a complete, consistent **tutorial** for the Lume admin app from a single topic
(e.g. "applicare uno sconto a una fiche") and, optionally, a founder-recorded video. One run produces:

- a **registry entry** (id, slug, title, summary, complexity, scope tags, prerequisites) in
  `src/lib/tutorials/registry.ts`,
- an **interactive guided tour** (`LumeTour`) in `src/lib/tutorials/tours/index.ts`,
- a **Markdown article** with **Playwright screenshots** at `public/tutorials/<slug>/`,
- any **`data-tour` anchors** the tour needs, added to the targeted components.

This is the repeatable factory for Lume's tutorial library. Unlike the marketing skills
(competitor-research, prospect-outreach) which only write to `output/`, this skill **writes into
`src/` and `public/` and seeds the demo database** — so it is `disable-model-invocation: true` and must
be invoked deliberately.

It builds on the runtime that already exists (read these first):
the chain-and-resume prerequisite system (`src/lib/tutorials/chain.ts`, `prerequisites.ts`,
`src/lib/stores/tourQueue.ts`), the tour engine wiring (`TourBridge.tsx`, `StartGuideButton.tsx`,
`TourWelcome.tsx`, `TourCard.tsx`), and the article renderer (`TutorialArticle.tsx`).

## Context to read before starting

- `src/lib/tutorials/types.ts` — `Tutorial`, `Prerequisite`, `LumeTour`, `LumeTourStep`, `TourMode`.
- `src/lib/tutorials/registry.ts` — the `tutorials` array + `getTutorialBySlug` / `getTutorialById`.
- `src/lib/tutorials/tours/index.ts` — the tour shape + **authoring principles** doc comment.
- `src/lib/tutorials/prerequisites.ts` — the live predicates (`hasClients`, `hasCoupons`, …).
- `reference/dependency-map.md` — the entity → prerequisite graph + the canonical create-flow step pattern.
- `reference/anchors.md` — the `data-tour` naming convention + how to find & place anchors.
- `reference/seed-recipes.md` — idempotent, demo-only seeding patterns.
- `tests/fixtures/{test-env,salon,seed}.ts` — demo salon id, login creds, service-role seed helpers.

## Before you start (preconditions)

1. **Dev server running** at `http://localhost:3000` against the SAME Supabase project that holds the
   demo salon (the one in `.env.test`). The e2e setup already assumes `.env.local` and `.env.test`
   point at the same project; if yours don't, start a dedicated authoring session pointed at the demo
   project. Do **not** start/stop the dev server from the skill — ask the user to start it.
2. **`.env.test` present and filled.** Read it (via `tests/fixtures/test-env.ts`) for: `E2E_TEST_SALON_ID`
   (the demo salon — it's **"Test Salone Demo"**, the data-rich one), `E2E_OWNER_EMAIL` /
   `E2E_OWNER_PASSWORD` (login), `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (seeding). If
   it's missing or still has the `.env.test.example` placeholders, **stop and ask the user to fill it** —
   you can read the salon id + an owner's email via MCP, but **passwords are hashed and unreadable**, so
   you cannot log in without the owner giving you a password (or a fresh demo owner can be made with a
   known password via `scripts/demo/create-demo-user.ts <demo+x@lume.app> "Name" <password>`).
3. **Seeding target matches screenshots.** Before any `execute_sql`, confirm the Supabase MCP project
   (`mcp__supabase__get_project_url`) equals `NEXT_PUBLIC_SUPABASE_URL` in `.env.test`. If they differ,
   do NOT use the MCP — seed with a one-off Node snippet using the `.env.test` service-role key instead
   (mirror `tests/fixtures/seed.ts`). The seed and the screenshots must hit the same database.

## Workflow

Track these steps with TodoWrite. Steps 1 and the spec confirmation are interactive; the rest run through.

### Step 1 — Derive and CONFIRM the spec

From `$1` (the topic) derive a tutorial spec, then **confirm it with the user (AskUserQuestion) before
writing anything**:

- `slug` — kebab-case Italian (`applica-sconto`, `crea-cliente`).
- `title` / `summary` — plain Italian (see PRODUCT.md: clear, friendly, no jargon).
- `complexity` — `base | avanzato | power`; `scopes` — from the `Scope` union.
- **target route** and the exact ordered **action sequence** (open page → open modal → fill fields →
  save → result), each mapped to a `narrate` or `action` step.
- **prerequisite chain** — using `reference/dependency-map.md`. List each prerequisite as
  `{ label, predicate, tutorialId }`. Verify every referenced `tutorialId` already exists in the
  registry; if one is missing, warn and recommend generating it first (see Build order) — the runtime
  degrades to a preflight link, but the chain is best when all prerequisites exist.

Present the spec compactly (slug, title, complexity, scopes, the step list, the resolved chain) and ask
for confirmation/edits. Only proceed once confirmed.

### Step 2 — Instrument anchors

The tour targets elements by CSS selector. Nav anchors exist (`[data-tour="nav-<route>"]`); the rest
usually don't. Add each with an **attribute-only** Edit (never restructure), per `reference/anchors.md`:

- `action-<entity>-create` — the header "Nuovo X" button (always rendered, so it covers the empty list too).
- `field-<entity>-<field>` — each required input; this selector is also the step's `advanceWhenFilled` gate.
- `save-<entity>` — the modal confirm button. It's in the SHARED `AddModal`: pass
  `confirmDataTour="save-<entity>"` from the entity's `Add*Modal`, don't hard-code it in `AddModal`.
- `<route>-page` — the page's root `<div>`, for whole-page narrate steps.
- A list search box that can't take a prop (e.g. `Searchbar`): target it by selector
  `input[placeholder="Cerca cliente..."]`.
- Record `file:line` for every anchor (report at the end).

Then add the create flow's tour events — one-line `emitTourEvent(...)` from `src/lib/tutorials/tourEvents.ts`
(no-ops without a running tour):
- `<entity>:created` in the create-success path (store action or modal submit), step `completeOn:'<entity>:created'`.
- `<entity>:modal-open` from the modal's **`onEnterComplete`** prop (`Modal`→`AddModal`), NOT on `isOpen`
  — so the next step measures the settled modal, not mid-animation. Step `completeOn:'<entity>:modal-open'`.
- Field steps and the search step need NO event — they use `advanceWhenFilled` (TourCard polls the input).

### Step 3 — Seed the demo salon (idempotent, demo-only)

The article screenshots need the feature reachable (e.g. an existing coupon to show the apply-discount
view). Resolve the demo `salon_id` = `E2E_TEST_SALON_ID`. **Check** current counts with read-only
`execute_sql` scoped to that salon; for anything the tutorial needs that's missing
(clients/services/operators/abbonamenti/coupons/gift cards), seed it **additively and idempotently**
using `reference/seed-recipes.md`. Every statement must be guarded so it is a no-op on re-run and can
never touch another salon (`salon_id` literal + `WHERE NOT EXISTS`). Read exact column shapes from the
type models (`src/lib/types/<Entity>.ts`) and `tests/fixtures/seed.ts`. This is where the demo salon
gains advanced content (abbonamenti, discounts, gift cards) so it's ready for any future tutorial.

### Step 4 — Capture screenshots (Playwright MCP)

1. `browser_navigate` to `/login`; `browser_fill_form` / `browser_type` the demo owner email
   ("Email o telefono") and password ("Password"); click "Accedi". If it lands on `/select-salon`, pick
   the demo salon.
2. `browser_resize` to 1440×900.
3. Walk the real flow: `browser_navigate` / `browser_click`, `browser_wait_for` each meaningful state,
   `browser_take_screenshot` → `public/tutorials/<slug>/NN-name.png` (`01-open-clienti.png`,
   `02-modal.png`, …), one shot per article section. **Pick a worked-example name that does NOT already
   exist in the demo salon** (check first via a quick `execute_sql` count or the list UI): the final
   "find the new row" search must return exactly one result, or the screenshot is ambiguous (e.g. reusing
   "Taglio donna" surfaced two rows; switching to "Piega serale" fixed it).
4. Assert each Step-2 anchor exists (`browser_evaluate` `document.querySelector('[data-tour="…"]')`).
5. **Smoke-test the tour itself** (don't just screenshot the flow — generate the tour first, or do this
   after Step 6). Start the guide and click through every step, asserting via `browser_evaluate`:
   (a) each step's `selector` resolves; (b) whole-page narrate cards are **fully inside the viewport**
   (`rect.top>=0 && rect.bottom<=innerHeight && …`); (c) each `advanceWhenFilled` step's "Avanti" is
   disabled when the field is empty and enabled after typing. This is where the subtle bugs surface
   (card overflow, mis-anchored coachmark, a gate that never enables).
6. `browser_close`.

### Step 5 — Write the article

Write `public/tutorials/<slug>/article.md` — plain Markdown (MDX-compatible), Italian, step-by-step,
referencing screenshots with **absolute** paths: `![passo 1](/tutorials/<slug>/01-open-clienti.png)`.
Do **not** open with a top-level `# Titolo` (the page already shows the title) — start with prose or an
`## Section`. `TutorialArticle.tsx` fetches and renders this file; set `articleSlug: '<slug>'` on the
registry entry so the page shows it. (The repo renders Markdown via `react-markdown`; this is the
default. Only wire `@next/mdx` if the user explicitly wants compiled MDX and it builds under Turbopack.)

### Step 6 — Generate the tour

Append a `LumeTour` to `lumeTours` in `src/lib/tutorials/tours/index.ts`, following the **canonical
create-flow shape** in `reference/dependency-map.md` exactly. Non-negotiable rules (all runtime-verified):

- **Interaction is locked to the spotlight** (`clickThroughOverlay` is OFF — keep it off). Every step's
  user action must be on the highlighted element or the card's own buttons.
- **Advance** via `advanceOnRoute` (nav), `completeOn` (modal-open / created), or `advanceWhenFilled`
  (one per required field + the search box). Never auto-advance a field step on content.
- **Whole-page narrate steps** (intro + wrap-up) anchor on `[data-tour="<route>-page"]` and **omit
  `side`** so the card is fixed-centered (a `side` overflows the screen on a full-page target).
- **No `startRoute`** when step 0 is the nav action (it would pre-navigate and skip step 0).
- `endRoute:'/admin/aiuto/<slug>'`; tour id = the tutorial's `tourId`. Selectors = the real Step-2 anchors.

### Step 7 — Register the tutorial

Add the `Tutorial` to `src/lib/tutorials/registry.ts` with `tourId`, `articleSlug`, `videoPath` (if a
video was provided), and `prerequisites: [...]` referencing predicates from `prerequisites.ts` (add a
new predicate there if the topic needs one not present) and the chained `tutorialId`s. If a video file
was provided, note it for upload to the Supabase `tutorials` bucket (manual/owner step) and set
`videoPath`.

### Step 8 — Verify and report

Run `npm run check` (tsc + eslint) — must be clean. Then report:
- files **created** and **modified**,
- **anchors** added (with `file:line`),
- **rows seeded** (table, count, demo `salon_id`),
- the **resolved prerequisite chain** for the new tutorial,
- the URL to preview: `/admin/aiuto/<slug>`.

## Guardrails

- **Demo-salon-only seeding.** Assert `salon_id = E2E_TEST_SALON_ID` in every seed statement; additive
  and idempotent (`WHERE NOT EXISTS`); never `UPDATE`/`DELETE` real rows; never seed another salon.
- **Clean up rows you created through the UI.** The screenshot pass and each tour smoke-test create REAL
  rows via the create flow (one per run). When done, `DELETE` ONLY those — scope by demo `salon_id` + the
  worked-example name (add a recent `created_at` filter if the name might collide with pre-existing data) —
  so they don't pile up across runs. This is removing your OWN throwaway rows; it does NOT contradict the
  "never DELETE real rows" rule above, which protects pre-existing demo/tenant data.
- **Seed and screenshots share one database** (Step 0 check). If unsure, don't seed.
- **Minimal `src/` edits.** Anchors are attribute-only; added logic is limited to `emitTourEvent`
  one-liners, forwarding `data-tour` / `confirmDataTour` props, and wiring `onEnterComplete` to emit the
  modal-open event. Never refactor business logic.
- **Keep interaction locked.** Do NOT enable `clickThroughOverlay` on `<NextStep>` — the user must only
  be able to touch the spotlighted element. Design steps around that (see the canonical pattern).
- **Verify by running the tour, not just by building it.** A clean `npm run check` is necessary but not
  sufficient — the card-overflow, mis-anchored-coachmark, and gate-never-enables bugs only show at
  runtime (Step 4.5). Drive the whole tour in Playwright before reporting done.
- **Plain Italian** for every title/summary/step/article (PRODUCT.md voice).
- **Quote UI labels with straight double quotes `"..."`, never guillemets `«...»`.** When a tour
  step, title, or article references an on-screen label, write it as `Clicca "Nuovo cliente"` (not
  `«Nuovo cliente»`). Applies to tour `title`/`content` and article copy alike.
- **Design-system compliance.** Tours render through the existing `TourCard` / `TourWelcome` (tokens,
  Portal, `--z-*`); never hand-roll z-index or colors.
- **Missing prerequisite tutorial** → warn and recommend generating it first; never reference a
  `tutorialId` that doesn't resolve as if it will chain.
- **Confirm the spec before generating** (Step 1).

## What this skill does NOT do

- Does not start or stop the dev server.
- Does not run migrations (`apply_migration`) or alter schema — it only inserts demo rows.
- Does not touch any non-demo salon or production tenant data; no UPDATE/DELETE.
- Does not upload videos automatically (it sets `videoPath`; the upload is a manual owner step).
- Does not modify business logic — only tutorial artifacts, anchors, and demo seed rows.

## Build order (generate base tutorials first)

Chained `tutorialId`s must already exist, so build entities before composed flows:

1. `crea-cliente` · 2. `crea-servizio` · 3. `crea-operatore`  (no prerequisites)
4. `crea-coupon`  (needs a client + a service/product)
5. `crea-fiche`   (needs a client + a service + an operator)
6. `applica-sconto`  (chains client → service → coupon → fiche)
7. abbonamenti / gift-card flows  (after their base entities)
