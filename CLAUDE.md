# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Next.js local documentation

The installed version of Next.js ships its own documentation at `node_modules/next/dist/docs/`. These files are the **authoritative reference** for this exact version — always prefer them over training-data knowledge when writing Next.js code.

Directory map:

```
node_modules/next/dist/docs/
├── 01-app/
│   ├── 01-getting-started/   # Quick starts (installation, project structure, …)
│   ├── 02-guides/            # Feature guides (auth, caching, images, routing, …)
│   └── 03-api-reference/
│       ├── 01-directives/    # use-cache, use-client, use-server
│       ├── 02-components/    # <Image>, <Link>, <Form>, <Script>, <Font>
│       ├── 03-file-conventions/  # layout, page, proxy, error, loading, route, …
│       │   └── 02-route-segment-config/  # runtime, dynamicParams, maxDuration, instant
│       ├── 04-functions/     # cookies, headers, redirect, notFound, fetch, cache, …
│       ├── 05-config/        # next.config.ts options
│       └── 06-cli/           # next dev, build, start flags
└── 03-architecture/          # Rendering, caching, Turbopack internals
```

Before writing any Next.js code (components, route handlers, server actions, config), read the relevant file in this tree.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking only
npm run check        # Full check: tsc + eslint
```

There are no automated tests in this project.

## Product

**Lume** is a commercial SaaS product for hair and barber salons in Italy. It is NOT a website for a specific salon — it is a software tool sold on a subscription basis to salon owners across Italy.

**Why it exists:** The incumbent tool used by salons costs €60/month, is outdated, hard to use, and has poor UX. Lume is the modern alternative: clean, fast, intuitive.

**Pricing:**
- Monthly: €49/month
- Yearly: €490/year (2 months free, saves €98)

**Brand identity:**
- Name: Lume (Italian for "light" — the concept of clarity, illumination, making things visible)
- Aesthetic: Cool & crisp — zinc/slate backgrounds, indigo accent (`#6366F1`), clean Geist Sans typography
- Tone: Professional, modern, minimal — no luxury salon vibes
- The old brand (Synergia della Bellezza, Cormorant Garamond, `--salon-*` gold/cream colors) is fully replaced

**Multi-tenancy:** Implemented. `public.salons` is the tenant root; every tenant table has a `salon_id` FK and Supabase RLS scoped through `public.get_user_salon_id()` (which COALESCEs from `super_admin_impersonation` then `profiles.salon_id`). Platform admins impersonate via `/api/platform/enter-salon` (DB row written first, then `lume-active-salon-id` httpOnly + `lume-impersonating` non-httpOnly cookies). See "Multi-tenancy" under Key patterns for the recipe when adding a new tenant table.

**Competitor context:** The tool currently used by the target market costs €60/month. Lume undercuts it at €49/month with a dramatically better UX. Feature parity with that tool is the first milestone.

## Architecture

**Lume** is a business management app for hair and barber salons (Italian locale). It covers clients, operators, services, products, appointments (fiches), calendar, orders, coupons, and financial reporting.

### Stack
- **Next.js 16** (App Router) + React 19 + TypeScript 5
- **Supabase** — PostgreSQL database, Auth (JWT/cookies), Realtime subscriptions
- **Zustand** — client-side state, one store per entity
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- **Resend** — transactional email
- **D3** — charts/visualizations
- **date-fns** with Italian locale throughout

### Directory layout

```
src/
├── app/
│   ├── admin/          # Protected admin routes (bilancio, calendario, clienti, fiches, …)
│   ├── api/            # Route handlers (clients, operators, send-email, submit-review)
│   ├── auth/           # callback/ and logout/ handlers
│   └── page.tsx        # Public landing page
├── lib/
│   ├── components/
│   │   ├── admin/      # Feature-scoped UI (calendar/, clients/, fiches/, operators/, table/)
│   │   ├── graphs/     # D3 chart components
│   │   └── shared/ui/  # Buttons, forms, modals, sidebar, theme provider
│   ├── stores/         # Zustand stores — fetch/add/update/delete/setSelected per entity
│   ├── types/          # Class-based models; each exports static `dataColumns` for table rendering
│   ├── supabase/
│   │   ├── client.ts   # Browser Supabase client
│   │   └── server.ts   # SSR Supabase client (cookie-based auth)
│   ├── hooks/
│   │   └── useRealtimeStore.ts  # Supabase Realtime → Zustand sync
│   ├── utils/          # format.ts (EUR/Italian date), date.ts, calendar-config.ts
│   └── const/          # Nav routes, theme colours, salon config
```

### Key patterns

**Auth flow** — Supabase Auth + `public.profiles.role` for salon staff (`admin | owner | operator`). The four conceptual roles in the app are `admin | owner | operator | client`; `client` is NOT stored on `profiles.role` — clients are rows in `public.clients` linked by `user_id`, so a user is a "client" when `clients.user_id = auth.uid()`. Role constants and predicates (`isAdmin`, `canManageSalon`, `isSalonStaff`, …) live in `src/lib/auth/roles.ts`. Use them — never compare role strings inline. The OAuth callback in `app/auth/callback/` redirects based on role. Platform admins (`role='admin'`) have access to `/platform` and can impersonate any salon; the active salon during impersonation is tracked by the `super_admin_impersonation` table (RLS truth) and mirrored in httpOnly + non-httpOnly cookies (UI hints). API routes read the role via the server client before processing requests. Admin routes are protected at the layout + middleware level.

**State** — Each entity (clients, operators, products, services, fiches, coupons, orders, …) has its own Zustand store in `src/lib/stores/`. Stores follow a consistent shape: `items`, `selected`, `fetch()`, `add()`, `update()`, `delete()`, `setSelected()`. Real-time DB changes are pushed into stores via `useRealtimeStore`.

**Types / table columns** — Entity models are classes in `src/lib/types/`. Each class has a static `dataColumns` array that drives table rendering (column labels, field accessors, custom display logic). Use this pattern when adding new entities.

**Multi-tenancy** — Every tenant row has `salon_id uuid not null` FK to `public.salons`, and RLS is enabled on every tenant table with the four standard policies (SELECT/INSERT/UPDATE/DELETE) gated by `salon_id = get_user_salon_id()` (DELETE often further restricted to `get_user_role() = 'owner'`). Active salon for the caller is `super_admin_impersonation.salon_id` for impersonating platform admins, otherwise `profiles.salon_id`. Server code never reads `salon_id` from cookies for security decisions — it goes through `getCallerProfile()` ([src/lib/gateway/getCallerProfile.ts](src/lib/gateway/getCallerProfile.ts)) which returns `{id, salon_id, role}` for both regular users and impersonating admins. Stores read with the anon-key SSR/browser client and rely on RLS to filter; service-role usage is reserved for impersonation writes, auth user management, and orphan cleanup. **When adding a new tenant table**: add `salon_id uuid not null references public.salons(id) on delete cascade`, enable RLS, add the four standard policies, and verify with `npm run audit:tenancy`.

**API routes** — Server actions live in `src/app/api/`. They use the Supabase **service role key** (server-only env var) for privileged operations. Client-facing Supabase calls use the anon key.

**Supabase clients** — Always import from `src/lib/supabase/client.ts` for browser code and `src/lib/supabase/server.ts` for server components / route handlers. Never instantiate `createClient` directly elsewhere.

**Styling** — Tailwind CSS v4. No `tailwind.config.*` file; configuration is done via CSS in `app/globals.css`. Dark/light mode is managed by `ThemeProvider` in `src/lib/components/shared/ui/theme/`.

### Environment variables

| Variable | Where used |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only (API routes) |
| `RESEND_API_KEY` | Server only (`api/send-email`) |
| `KIE_API_KEY` | Server only |

Path alias `@/*` maps to `./src/*`.

## Project skills

Project-level Claude Code skills live in `.claude/skills/`. Marketing skills:

- **`/competitor-research [name-or-url]`** — profile a competitor (company basics, pricing, target market, tone of voice, branding, features/UVP, UI screenshots) and produce a Markdown report at `output/marketing/competitor-research/<slug>/report.md`. Auto-fetches via WebFetch and Playwright. See [.claude/skills/competitor-research/SKILL.md](.claude/skills/competitor-research/SKILL.md).
- **`/prospect-outreach [city-or-region] [hair|barber]`** — build a scored list of Italian salon prospects in a given area and produce an Italian cold-call template. Outputs to `output/marketing/prospects/<area>-YYYY-MM-DD.md` and `output/marketing/prospects/cold-call-template-it.md`. See [.claude/skills/prospect-outreach/SKILL.md](.claude/skills/prospect-outreach/SKILL.md).

Both skills hard-code Lume's positioning constants (€49/mo · €490/yr, indigo accent, Geist Sans, Italian salon vertical, €60/mo incumbent). If those change, update them in this file's "Product" section AND in each skill's frontmatter together.

Generated reports/screenshots in `output/marketing/` are gitignored (see `.gitignore`).

Start implementing only if you have 95% confidence in the code you're writing. Ask questions to reach that confidence.
When you're done, always check for lint errors by running the command.
Whenever I express architectural choices or styling choices, you should, if it's important, put it in this file for future reference, but ask me before editing it.