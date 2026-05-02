# TODO

**Sizes** — `(S)` <1d · `(M)` 1–3d · `(L)` ~1 week · `(XL)` >1 week
**Tags** — `[bug] [ux] [feat] [design] [infra] [data] [billing] [legal] [admin] [integ] [landing] [exp]`

Items marked _(proposed)_ are gaps flagged in review — keep, drop, or move as you like.

---

## Now
Currently in flight. Keep this section short; promote items here only when starting them.

- [ ] [ux] (M) Sessioni + quantità prodotti venduti + altre stats per cliente nelle tabelle delle entità

---

## Pre-launch must-haves
**Block onboarding paying salons safely.** A miss here means data loss, silent billing leakage, legal exposure, or production debugging without a safety net.

### Multi-tenancy
- [ ] [infra] (XL) `salons` table + Supabase RLS for `salon_id` scoping on every tenant table _(CLAUDE.md flags this as planned-not-built — single biggest unfinished piece of infra)_
- [ ] [feat] (M) Multi-salon owner: salon picker on login + dropdown replacing static salon name in nav

### Billing & subscriptions _(proposed)_
- [ ] [billing] (?) Stripe lifecycle end-to-end — trial expiry, failed-payment dunning, plan switch (€49/mo ↔ €490/yr), cancellation, reactivation
- [ ] [ux] (M) Subscription page — current plan, next charge, invoice history, change/cancel

### Trust & safety
- [ ] [infra] (L) Staging environment (separate Vercel project)
- [ ] [infra] (L) Staging Supabase database
- [ ] [infra] (L) Playwright automated tests against staging
- [ ] [infra] (M) Automated DB backups + documented restore runbook _(proposed)_
- [ ] [infra] (S) Sentry (or equivalent) error monitoring _(proposed)_
- [ ] [infra] (S) Uptime monitoring + public status page _(proposed)_

### Legal & compliance
- [ ] [legal] (XL) GDPR audit + pre-filled deliberatorie / consent forms (ask Ulisse)
- [ ] [legal] (M) Cookie consent banner — EU requirement before charging EU customers _(proposed)_
- [ ] [legal] (M) Account deletion + data export endpoints — GDPR Art. 15 (portability) + Art. 17 (erasure) _(proposed)_
- [ ] [legal] (S) Public Privacy Policy + Terms of Service pages — linked from footer _(proposed)_

---

## Launch leverage
**Drives conversion, retention, and word-of-mouth.** Determines whether a salon stays past month two.

### Client-facing booking
- [ ] [feat] (L) White-label online booking — service list, operator choice (toggleable), time slot, optional confirmation; one-time setup + edit page. **Largest moat vs. €60/mo incumbent**

### Communication & reminders _(proposed)_
**The single highest-leverage feature category in salon software** — one prevented no-show (≈€40–60) pays a month's subscription.
- [ ] [feat] (L) Promemoria appuntamento via WhatsApp/SMS — auto-send 24h before, optional confirmation reply
- [ ] [integ] (L) WhatsApp Business integration — bigger than Instagram in Italy for salon ↔ client comms
- [ ] [feat] (M) No-show tracking + reliability score per client — surfaces serial no-shows; tied to reminders

### Italian compliance & daily workflow _(proposed)_
- [ ] [feat] (XL) Fatturazione elettronica / SDI integration — required above forfettario threshold; absorbs another tool salons currently pay for
- [ ] [feat] (M) Chiusura cassa giornaliera + fondo cassa — standard end-of-day workflow

### Onboarding
- [ ] [feat] (M) End-to-end onboarding flow design — signup → first appointment booked _(proposed)_
- [ ] [feat] (L) First-run tutorial — pick format (video, step-and-highlight, modern overlay)
- [ ] [data] (M) Onboarding step to bulk-load salon data
- [ ] [data] (XL) Automatic import via Anthropic API + Supabase MCP
  - [ ] [data] (M) Passare tutti i dati da Stiv
  - [ ] [data] (L) On detected pre-existing data, prompt: add (blind), overwrite (clean slate), or merge (smart)

### Mobile
- [ ] [design] (L) Responsive pass on every page; intuitive phone interactions especially for tables and calendar

---

## Polish backlog
**Useful, not urgent.** Pull from here only when must-haves and leverage are empty.

### UX
- [ ] [ux] (M) Applicazione abbonamento e dove trovare i dettagli
- [ ] [ux] (L) Patch-notes overlay on login, auto-generated from commits; pulsating badge for new tutorials and features
- [ ] [ux] (M) Organize fiches in "Future/Prenotate", "Arretrate" and "Concluse"

### Features
- [ ] [feat] (L) Spese ricorrenti (Spotify, servizi, …)
- [ ] [feat] (M) Notifica auguri sul gestionale
- [ ] [feat] (L) Tessera cliente
- [ ] [feat] (L) AI image generation for products and services
- [ ] [feat] (M) Recurring appointments — clients on "every 4 weeks" rhythm without manual rebooking _(proposed)_
- [ ] [feat] (S) Buffer time between appointments — clean-up minutes after color services _(proposed)_
- [ ] [feat] (M) Wait list / lista d'attesa — capture demand when slots are full, auto-offer cancellations _(proposed)_
- [ ] [feat] (S) Codice fiscale field on client — needed for invoicing _(proposed)_
- [ ] [feat] (M) Foto cliente before/after on profile — high engagement, retention driver _(proposed)_
- [ ] [feat] (M) Re-engagement trigger — "non si vede da 60 giorni" surfacing, optional auto-WhatsApp _(proposed)_
- [ ] [feat] (M) In-product free-trial gating — countdown banner, paywall after expiry, upgrade flow _(proposed)_
- [ ] [feat] (L) Referral program — "give a month, get a month", tracked in-product _(proposed)_

### Design
- [ ] [design] (L) Audit codebase to add Motion animations where they help
- [ ] [design] (M) Page fly-in for nested dynamic routes (à la Cursum AI)
- [ ] [design] (S) Three-dots dropdown — match btn-to-dropdown spacing with btn-to-btn spacing
- [ ] [design] (S) Animate archive / delete icons on client cards
- [ ] [design] (S) Replace native `<select>` with custom dropdown component

### Admin / dashboard
- [ ] [admin] (M) "1% market coverage" component — custom circular progress bar
- [ ] [admin] (M) Aggregate stats on settings chosen by businesses
- [ ] [admin] (M) Per-operator commission reports _(proposed)_
- [ ] [admin] (M) Revenue dashboards — per service, per operator, year-over-year comparisons _(proposed)_
- [ ] [admin] (L) Export IVA / report mensile per il commercialista _(proposed)_

### Landing page
- [ ] [landing] (S) Make scroll affordance clear
- [ ] [landing] (S) Scroll-progress bar
- [ ] [landing] (M) Screenshots + GIFs from a populated demo salon
- [ ] [landing] (M) Demo booking — Calendly-style "book a 15-min demo" CTA; B2B salon owners want to see it before signing up _(proposed)_

### Integrations
- [ ] [integ] (M) Instagram

### Codebase health
- [ ] [infra] (M) Revisit `client_stats` / `client_ratings` aggregates once a real salon hits ~10k+ fiches — currently re-runs on every fiche / fiche_services / fiche_products realtime change. Options: materialized view, debounce, per-client RPC
- [ ] [infra] (S) Product analytics (PostHog / Mixpanel) — can't optimize churn or conversion blind _(proposed)_

---

## Exploration
**No commitment.** Research and validate before promoting out of this section.

- [ ] [exp] (M) Market research — how to structure a broader scope once the CMS exits dev phase
- [ ] [exp] (L) Potential-client tracker (numbers, call status, geography)
- [ ] [exp] (L) Voice/video → speaker-labelled transcript → Anthropic-API report pipeline + management & inspection UI
- [ ] [exp] (XL) Speech-to-speech AI for queries and actions (free integrations preferred)
- [ ] [exp] (M) Operator time-clock / shift tracking _(proposed)_
- [ ] [exp] (M) Light inventory — stock alerts, supplier orders, cost-of-goods _(proposed)_
- [ ] [exp] (M) Accessibility audit — keyboard nav, screen reader labels, calendar focus order _(proposed)_
- [ ] [exp] (L) i18n scaffolding (locale string extraction) — only if going beyond Italy _(proposed)_

---
---

# Done

## Bug
- [x] (S) Z-index on dropdown in client detail page
- [x] (S) Unavailability slot in calendar persists during confirmation modal
- [x] (S) Settings — animation no longer re-triggers on section change
- [x] Theme persists on refresh (instead of always re-applying)
- [x] Avatar dropdown in sidebar
- [x] Togliere categorie clienti
- [x] Dropdown abbonamento nella fiche più visibile
- [x] Merge valore gift card con importo incassato
- [x] Errore "Valore dello sconto non valido" su gift card
- [x] Messaggio fuori orario su chiusura fiche

## UX
- [x] (M) Bug button bottom-right (aligned with theme button) — screenshots current page, opens feedback modal with bug preselected and screenshot uploaded
- [x] (S) Drag handle (six dots) on calendar service blocks on hover (animation pushes text)
- [x] (S) Breadcrumb navigation + entity detail pages in trail
- [x] (S) Click subscription row to open edit modal
- [x] Time preview on calendar cell hover
- [x] Week calendar always clickable; one operator forced
- [x] Eye icon for password on login modal
- [x] Restructure + redesign client info page
- [x] Campi più grandi
- [x] Spostare il bottone di chiusura fiche dentro il modale
- [x] Cambiare il totale direttamente senza aggiornare i prezzi singoli
- [x] Calendario — filtro operatori, visualizzazione messe, colori e parziali su totale
- [x] Combobox a due livelli per servizi e prodotti nella fiche

## Personalization
- [x] Different working hours per operator
- [x] Column selection + sorting on all tables

## Features
- [x] Vacation in calendar
- [x] Compact vs default table density (wired to settings)
- [x] Change service names at checkout
- [x] Easier drag-and-drop calendar actions
- [x] Scheda tecnica (data, miscela, tecnica, note) accessibile da tutte le parti — hover solo l'ultima, click per pagina intera; cambio nota nel modale fiche
- [x] Archiviare servizi, prodotti, clienti invece di cancellarli
- [x] Servizi a omaggio (0 €)
- [x] Creazione coupon (servizio / soldi)
  - [x] Omaggi dal negozio
  - [x] Buono regalo
- [x] Feedback page con up/down
- [x] Pagina abbonamento
- [x] Email non più obbligatoria per creare cliente

## Impostazioni
- [x] Default validità buoni

## Data
- [x] (S) "Importa dati" option in three-dots menu of every page
