# Product

## Register

product

## Users

**Primary: Salon operator/owner, 30–60 years old.**
Italian hair or barber salon. Variable computer literacy, some have only ever
used a 15-year-old Windows program or a paper agenda. Will not read
documentation. Mostly works on a desktop PC at the reception desk between
clients; occasionally checks tomorrow's appointments from a phone after hours,
or quickly edits something from home.

**Secondary: Salon's own clients (end customers).**
Italians booking from a phone. They visit briefly, do one thing, leave. They
never see the admin app.

## Product Purpose

Lume is a SaaS tool sold to Italian hair and barber salons (€49/month, €490/year)
to run the entire business: clients, operators, services, products,
appointments, calendar, orders, coupons, financial reporting, plus a
phone booking surface for the salon's own customers.

It exists to replace the incumbent category (Treatwell Connect, Stiv, Area
Salon, Imaginsalon, etc.) which costs €60+/month and feels like Windows
software from 2008. Success: a salon owner who has never used Lume completes
their first booking within 30 seconds of opening the calendar, and a 50-year-old
who has used paper for two decades trusts it enough to switch.

## Brand Personality

**Three words: clear, calm, modern.**

- *Clear* — Lume means "light" in Italian. Every screen reduces ambiguity. Copy
  uses plain Italian, never jargon, never English borrowings where Italian works.
- *Calm* — generous space, quiet color, no urgency design. The salon is already
  a busy environment; the software is the still point.
- *Modern* — feels like a 2026 product, not a 2010 one. The operator should
  feel slightly proud opening it in front of a client.

**Voice:** like a friendly colleague who explains things once, then trusts you.
Confident, never patronizing. Direct, never so terse it becomes cryptic.

**Emotional goal:** the operator feels in control, not overwhelmed. Lume earns
its €49/month by feeling effortless, not by feature-stacking.

## Anti-references

- **Treatwell Connect, Stiv, Area Salon, Imaginsalon** and the rest of the
  incumbent category. Cluttered Windows-era forms, dropdowns nested four deep,
  gray gradients, tiny grid lines, every pixel filled with controls. If a
  screen ends up looking like one of these, redesign it.
- **The "salon software" aesthetic.** Pink and gold gradients, scissor icons,
  stock photos of women with foils, script display fonts, cream-and-gold
  "luxury" palettes. Lume is software, not a salon brochure.
- **The previous Lume identity.** Cormorant Garamond display type, "Synergia
  della Bellezza" naming, gold/cream `--salon-*` tokens. Fully replaced.
- **Generic SaaS templates.** Pastel illustrations of people high-fiving, hero
  metrics with gradient sparklines, "trusted by 1000+ teams" social-proof bars,
  out-of-the-box shadcn-card-on-cream-background.

## Design Principles

1. **Obvious beats clever.** Every action must be doable without asking
   anyone. If a feature needs a tooltip to be found, the design has failed.
2. **The calendar is the home.** Lume lives or dies by how the appointment
   grid feels. Other surfaces are allowed to be slower and less dense; the
   calendar must feel native-app fast and never make the operator wait,
   scroll for a hidden action, or lose their place.
3. **Plain Italian, every word.** No English unless there is no Italian word.
   No abbreviations in labels. UI copy reads like a colleague speaking, not a
   software menu.
4. **Quiet by default, loud when it matters.** Indigo accent is rare and
   meaningful: primary actions, the selected appointment, a single critical
   alert. Everything else lives in tinted neutrals. A colored UI is a noisy
   salon; ours is a quiet one.
5. **Trust the user, don't quiz them.** No multi-step confirmation chains for
   routine actions. One-click save, one-click cancel, undo when something is
   actually destructive. The 50-year-old owner should never feel interrogated
   by their own software.

## Accessibility & Inclusion

Priority order, highest first. When two requirements conflict, the higher one
wins.

1. **Cross-device usability.** Every primary task must be completable on three
   surfaces: a 1366×768 reception PC (the operator's daily driver), a tablet
   or touch-screen all-in-one (some salons run these), and a phone (the
   operator from home, the client booking). Touch targets ≥44×44 always.
   Full keyboard navigation, no dead ends. No hover-only affordances. The
   calendar in particular must remain usable on a phone screen, not a
   desktop-only experience with a phone fallback.
2. **Low tech literacy.** No empty state without a literal "do this next"
   prompt. No icon-only buttons in primary navigation. No abbreviations in
   labels (write "appuntamento", not "appt"). Destructive actions are always
   undoable, never confirm-modal-to-final.
3. **WCAG 2.2 AAA as the contrast goal.** Aim for 7:1 body text and 4.5:1
   large text. If the indigo accent cannot meet AAA against a given surface
   without breaking brand identity, fall back to AA with a clearly visible
   focus state for that combination. Do not sacrifice cross-device usability
   or readability to chase AAA.
4. **Reduced motion.** Respect prefers-reduced-motion on all transitions,
   view-transitions, marquees, and the existing wipe theme curtain.
5. **Color-blind safe.** Status colors (success / warning / danger) are never
   the only signal: always pair with icon and text. Charts must remain
   legible in monochrome.
6. **Italian-only locale.** No i18n abstraction needed. EUR with Italian
   formatting (1.234,56 €). Italian dates (lunedì 1 maggio, 01/05/2026).
