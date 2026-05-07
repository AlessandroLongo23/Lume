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
- [x] [infra] (XL) `salons` table + Supabase RLS for `salon_id` scoping on every tenant table — done. `salons` table + 25 tenant tables with RLS + `get_user_salon_id()` helper + admin impersonation via `super_admin_impersonation` were already shipped; this audit closed the four advisor-flagged gaps (super_admin_impersonation policies, feedback views SECURITY INVOKER, internal `SECURITY DEFINER` EXECUTE, public bucket listing) and added `npm run audit:tenancy` smoke test.
- [ ] [feat] (M) Multi-salon owner: salon picker on login + dropdown replacing static salon name in nav

### Billing & subscriptions _(proposed)_
- [ ] [billing] (?) Stripe lifecycle end-to-end — trial expiry, failed-payment dunning, plan switch (€49/mo ↔ €490/yr), cancellation, reactivation
- [*] [ux] (M) Subscription page — current plan, next charge, invoice history, change/cancel

### Trust & safety
- [ ] [infra] (L) Staging environment (separate Vercel project)
- [ ] [infra] (L) Staging Supabase database
- [ ] [infra] (L) Playwright automated tests against staging
- [ ] [infra] (M) Automated DB backups + documented restore runbook _(proposed)_
- [ ] [infra] (S) Sentry (or equivalent) error monitoring _(proposed)_
- [ ] [infra] (S) Uptime monitoring + public status page _(proposed)_

### Legal & compliance
- [ ] [legal] (XL) GDPR audit + pre-filled deliberatorie / consent forms (ask Ulisse)
- [x] [legal] (M) Cookie consent banner — EU requirement before charging EU customers _(proposed)_
- [ ] [legal] (M) Account deletion + data export endpoints — GDPR Art. 15 (portability) + Art. 17 (erasure) _(proposed)_
- [ ] [legal] (S) Public Privacy Policy + Terms of Service pages — linked from footer _(proposed)_

---

## Launch leverage
**Drives conversion, retention, and word-of-mouth.** Determines whether a salon stays past month two.

### Client-facing booking
- [ ] [feat] (L) White-label online booking — service list, operator choice (toggleable), time slot, optional confirmation; one-time setup + edit page. **Largest moat vs. €60/mo incumbent**
- [ ] [feat] (M) Merge clienti — quando un cliente importato (senza email/phone) si registra online, prompt allo staff "Possibile duplicato di [Mario Rossi]? Unisci?". Sposta fiches/appuntamenti del profilo guest sul nuovo profilo con auth e archivia il vecchio. Match suggerito su (in ordine): codice fiscale > telefono > email > nome+data nascita. **Necessario prima del rilascio della prenotazione online cliente.**

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
- [ ] [data] (M) Goes over the most important settings, like opening time, authorizations and permissions, online booking service and setup, etc. (all clarifying that it could be done at any time and with a "Salta" button), for an initial setup
- [*] [data] (XL) Automatic import via Anthropic API + Supabase MCP
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
- [ ] [ux] (S) More navigation opportunities, with between-pages links
- [ ] [ux] (M) Add spotify integration to control the music from the CMS
- [x] [ux] (M) Bug button bottom-right (aligned with theme button) — screenshots current page, opens feedback modal with bug preselected and screenshot uploaded
- [x] [ux] (S) Drag handle (six dots) on calendar service blocks on hover (animation pushes text)
- [x] [ux] (S) Breadcrumb navigation + entity detail pages in trail
- [x] [ux] (S) Click subscription row to open edit modal
- [x] [ux] Time preview on calendar cell hover
- [x] [ux] Week calendar always clickable; one operator forced
- [x] [ux] Eye icon for password on login modal
- [x] [ux] Restructure + redesign client info page
- [x] [ux] Campi più grandi
- [x] [ux] Spostare il bottone di chiusura fiche dentro il modale
- [x] [ux] Cambiare il totale direttamente senza aggiornare i prezzi singoli
- [x] [ux] Calendario — filtro operatori, visualizzazione messe, colori e parziali su totale
- [x] [ux] Combobox a due livelli per servizi e prodotti nella fiche

### Features
- [ ] [feat] (M) Export data with format selection (.csv, .xlsl, .pdf, sql dump)
- [ ] [feat] (L) recurrent expenses (Spotify, servizi, …)
- [ ] [feat] (M) Notifica auguri sul gestionale
- [ ] [feat] (L) Tessera cliente
- [ ] [feat] (L) AI image generation for products and services
- [ ] [feat] (M) Recurring appointments — clients on "every 4 weeks" rhythm without manual rebooking _(proposed)_
- [ ] [feat] (S) Buffer time between appointments — clean-up minutes after color services _(proposed)_
- [ ] [feat] (M) Wait list / lista d'attesa — capture demand when slots are full, auto-offer cancellations _(proposed)_
- [ ] [feat] (S) Codice fiscale field on client — needed for invoicing _(proposed)_
- [ ] [feat] (M) Foto cliente before/after on profile — high engagement, retention driver _(proposed)_
- [x] [feat] (M) In-product free-trial gating — countdown banner, paywall after expiry, upgrade flow _(proposed)_
- [x] [feat] (L) Referral program — "give a month, get a month", tracked in-product _(proposed)_
- [x] [feat] Vacation in calendar
- [x] [feat] Compact vs default table density (wired to settings)
- [x] [feat] Change service names at checkout
- [x] [feat] Easier drag-and-drop calendar actions
- [x] [feat] Scheda tecnica (data, miscela, tecnica, note) accessibile da tutte le parti — hover solo l'ultima, click per pagina intera; cambio nota nel modale fiche
- [x] [feat] Archiviare servizi, prodotti, clienti invece di cancellarli
- [x] [feat] Servizi a omaggio (0 €)
- [x] [feat] Creazione coupon (servizio / soldi)
  - [x] Omaggi dal negozio
  - [x] Buono regalo
- [x] [feat] Feedback page con up/down
- [x] [feat] Pagina abbonamento
- [x] [feat] Email non più obbligatoria per creare cliente

### Design
- [ ] [design] (L) Storybook integration for DS maintainance
- [ ] [design] (L) Audit codebase to add Motion animations where they help
- [ ] [design] (M) Page fly-in for nested dynamic routes (à la Cursum AI)
- [ ] [design] (S) Three-dots dropdown — match btn-to-dropdown spacing with btn-to-btn spacing
- [ ] [design] (S) Animate archive / delete icons on client cards
- [ ] [design] (S) Replace native `<select>` with custom dropdown component

### Admin / dashboard
- [x] [admin] (M) Contacts page for noting down who to call, who has already been called, google maps link, reason why not, phone number, material sent (boolean) via whatsapp
- [*] [admin] (M) "1% market coverage" milestones component — custom circular progress bar
- [ ] [admin] (M) Aggregate stats on settings chosen by businesses
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

## Bug
- [x] [bug] (S) Z-index on dropdown in client detail page
- [x] [bug] (S) Unavailability slot in calendar persists during confirmation modal
- [x] [bug] (S) Settings — animation no longer re-triggers on section change
- [x] [bug] Theme persists on refresh (instead of always re-applying)
- [x] [bug] Avatar dropdown in sidebar
- [x] [bug] Togliere categorie clienti
- [x] [bug] Dropdown abbonamento nella fiche più visibile
- [x] [bug] Merge valore gift card con importo incassato
- [x] [bug] Errore "Valore dello sconto non valido" su gift card
- [x] [bug] Messaggio fuori orario su chiusura fiche

---
---

## Personalization
- [x] Different working hours per operator
- [x] Column selection + sorting on all tables

## Settings
- [x] Default validità buoni

## Data
- [x] (S) "Importa dati" option in three-dots menu of every page
