---
name: Lume
description: The quiet salon. Software for Italian hair and barber salons that earns its keep by feeling effortless.
colors:
  lamplight-indigo: "oklch(0.620 0.190 275)"
  lamplight-indigo-hover: "oklch(0.540 0.210 275)"
  lamplight-indigo-active: "oklch(0.470 0.190 275)"
  lamplight-indigo-soft: "oklch(0.970 0.020 275)"
  brass-amber: "oklch(0.785 0.160 80)"
  brass-amber-soft: "oklch(0.980 0.020 80)"
  graphite-50: "oklch(0.985 0.002 265)"
  graphite-100: "oklch(0.967 0.003 265)"
  graphite-200: "oklch(0.902 0.005 265)"
  graphite-400: "oklch(0.692 0.010 265)"
  graphite-600: "oklch(0.421 0.011 265)"
  graphite-700: "oklch(0.341 0.010 265)"
  graphite-950: "oklch(0.106 0.004 265)"
  pure-white: "#FFFFFF"
  midnight-shell: "oklch(0.148 0.007 265)"
  midnight-surface: "oklch(0.192 0.008 265)"
  midnight-raised: "oklch(0.232 0.009 265)"
  midnight-border: "oklch(0.295 0.010 265)"
  midnight-text: "oklch(0.965 0.004 265)"
  midnight-text-secondary: "oklch(0.780 0.010 265)"
  midnight-text-muted: "oklch(0.605 0.012 265)"
  info-blue: "oklch(0.600 0.180 245)"
  success-green: "oklch(0.650 0.170 148)"
  warning-yellow: "oklch(0.820 0.165 95)"
  danger-red: "oklch(0.640 0.200 25)"
  receipt-paper: "oklch(0.985 0.005 95)"
typography:
  display:
    fontFamily: "'Geist', 'Helvetica Neue', sans-serif"
    fontSize: "3.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Geist', 'Helvetica Neue', sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Geist', 'Helvetica Neue', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "normal"
  body:
    fontFamily: "'Geist', 'Helvetica Neue', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "'Geist', 'Helvetica Neue', sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "0.04em"
  mono:
    fontFamily: "'JetBrains Mono', 'Menlo', monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  none: "0"
  sm: "0.25rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1rem"
  2xl: "1.5rem"
  full: "9999px"
spacing:
  unit: "0.25rem"
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  2xl: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.lamplight-indigo}"
    textColor: "{colors.pure-white}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0.625rem 1.25rem"
  button-primary-hover:
    backgroundColor: "{colors.lamplight-indigo-hover}"
    textColor: "{colors.pure-white}"
  button-primary-active:
    backgroundColor: "{colors.lamplight-indigo-active}"
    textColor: "{colors.pure-white}"
  button-secondary:
    backgroundColor: "{colors.pure-white}"
    textColor: "{colors.graphite-950}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0.625rem 1.25rem"
  button-secondary-hover:
    backgroundColor: "{colors.graphite-100}"
    textColor: "{colors.graphite-950}"
  button-destructive:
    backgroundColor: "{colors.danger-red}"
    textColor: "{colors.pure-white}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0.625rem 1.25rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.graphite-950}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0.625rem 1.25rem"
  input:
    backgroundColor: "{colors.pure-white}"
    textColor: "{colors.graphite-950}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
  card:
    backgroundColor: "{colors.pure-white}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
  chip:
    backgroundColor: "{colors.graphite-100}"
    textColor: "{colors.graphite-700}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.125rem 0.5rem"
---

# Design System: Lume

## 1. Overview

**Creative North Star: "The Quiet Salon"**

A salon is already loud. The phone rings, scissors snap, the radio plays, two
clients want to talk at once. Lume is the still point in that room. Every
screen is generous with space, quiet with color, and direct with its words.
The operator should feel a small drop in shoulder tension when they look at
the screen, not the small spike they get from the incumbent's gray-on-gray
clutter.

The system is built in three layers: a perceptually uniform OKLCH palette
(hue 265 cool graphite, hue 275 lamplight indigo, hue 80 brass amber, plus
status hues), theme-independent primitives (4px spacing grid, six radii,
two easing curves, three durations), and semantic role tokens that swap
between a near-white light mode and an indigo-tinted graphite dark mode. The
palette is the only place raw color literals live. Everything downstream
references through the semantic layer.

This system explicitly rejects four families: the incumbent salon-software
aesthetic (Treatwell Connect, Stiv, Area Salon, Imaginsalon: dense
Windows-era forms, four-deep dropdowns, gray gradients, every pixel filled);
the "luxury salon brochure" aesthetic (pink and gold gradients, scissor
icons, script display fonts, stock photos of women with foils); the previous
Lume identity (Cormorant Garamond, "Synergia della Bellezza" naming, gold
and cream `--salon-*` tokens, fully retired); and generic SaaS templates
(pastel high-fives, hero-metric gradients, "trusted by 1000+ teams" social
proof, out-of-box shadcn-card-on-cream).

**Key Characteristics:**

- **Quietly tactile.** Buttons lift one pixel on hover, cards glow at the
  border with `--lume-accent-muted`. Every interaction confirms itself
  without theatrics. No bouncy elastic, no scale-115 zooms, no shimmer
  passes.
- **Indigo as a rare event.** Lamplight Indigo carries primary actions, the
  one selected appointment, the focused field, the one active alert.
  Everywhere else lives in graphite neutrals. A screen with three indigo
  elements is a screen with a bug.
- **Two themes, both first-class.** Light mode is the default for daytime
  reception PCs. Dark mode is built deliberately, not as a tinted inversion:
  a four-tier elevation ramp lifted off pure black, hue 265 carried through
  for "indigo-tinted graphite", chromatic feedback borders, shadow alpha
  pushed to 0.55 so depth stays visible.
- **Italian throughout.** Geist Sans (Western Latin glyph set), JetBrains
  Mono for prices and IDs, dates and currencies in Italian formatting. No
  English borrowings where Italian works.

## 2. Colors: The Lamplight Palette

The palette is intentionally narrow: one accent, one warm complement, one
cool neutral family with eleven steps, four functional status hues, and one
intentional off-palette aesthetic surface. All values OKLCH; the palette
file is the single source of truth and the only file in the codebase
allowed to hold color literals.

### Primary

- **Lamplight Indigo** (`oklch(0.620 0.190 275)`, ≈ `#6366F1`): the only
  brand accent. Used for primary buttons, the selected appointment in the
  calendar, the focused input ring, the active nav item, the one critical
  alert. Hue 275 leans slightly toward violet, which is what gives it a
  warmer "lamp glow" character than a true indigo. Hover steps to
  `oklch(0.540 0.210 275)`, active to `oklch(0.470 0.190 275)`.
- **Lamplight Indigo Soft** (`oklch(0.970 0.020 275)`): the wash backing for
  selected rows, accent-light fills, the hero gradient stop in light mode.

### Secondary

- **Brass Amber** (`oklch(0.785 0.160 80)`): warm complement to indigo, used
  sparingly for upgrade prompts, promo highlights, the second stop of the
  hero gradient, and the chromatic counterweight on long-form pages. Never
  carries primary actions; never appears next to indigo on the same control.

### Neutral: The Graphite Family

A single cool-graphite family at hue 265 covers every text, surface, and
border role across both themes. Eleven OKLCH steps from near-white to
near-black. The same family powers light-mode neutrals and the dark-mode
"indigo-tinted graphite" surfaces, which is why both themes feel like
parts of the same product.

- **Graphite 50** (`oklch(0.985 0.002 265)`): light-mode app shell.
- **Graphite 100** (`oklch(0.967 0.003 265)`): light-mode surface (sidebar,
  topbar, subtle fills).
- **Graphite 200** (`oklch(0.902 0.005 265)`): light-mode borders, dividers,
  disabled states.
- **Graphite 400** (`oklch(0.692 0.010 265)`): muted text in light mode,
  placeholder text in inputs.
- **Graphite 600** (`oklch(0.421 0.011 265)`): secondary text in light mode.
- **Graphite 950** (`oklch(0.106 0.004 265)`): primary text in light mode.
- **Pure White** (`#FFFFFF`): raised surfaces (cards, modals, popovers,
  control backgrounds), button-on-accent foreground. The one literal in
  semantic.css; everything else is OKLCH.

### Neutral: The Midnight Layer (Dark Mode)

Dark mode is not "the light theme inverted". It uses a four-tier elevation
ramp lifted off pure black so each surface is *perceptibly* a step up from
the one below. Premium dark UIs (Linear, Vercel, Raycast) never sit on
`#000`; neither does Lume.

- **Midnight Shell** (`oklch(0.148 0.007 265)`): app shell / body.
- **Midnight Surface** (`oklch(0.192 0.008 265)`): sidebar, topbar, cards.
- **Midnight Raised** (`oklch(0.232 0.009 265)`): modals, popovers, hover
  states.
- **Midnight Border** (`oklch(0.295 0.010 265)`): visible separation
  without noise.
- **Midnight Text** (`oklch(0.965 0.004 265)`) / **Secondary**
  (`oklch(0.780 0.010 265)`) / **Muted** (`oklch(0.605 0.012 265)`): hits
  ~7:1 / ~4.5:1 against the shell. Pure 1.0 white is rejected because it
  causes optical buzz on dark surfaces.

### Status

Each is a 500-step anchor; tonal scales live in DESIGN.json.

- **Info Blue** (`oklch(0.600 0.180 245)`): neutral information,
  in-progress states.
- **Success Green** (`oklch(0.650 0.170 148)`): completed bookings,
  positive confirmations.
- **Warning Yellow** (`oklch(0.820 0.165 95)`): pending payments, soft
  cautions, never used as the only signal.
- **Danger Red** (`oklch(0.640 0.200 25)`): destructive actions, payment
  failures, hard errors.

### Aesthetic Surface

- **Receipt Paper** (`oklch(0.985 0.005 95)`): the deliberate off-palette
  warm paper-white that backs the Fiche thermal-receipt UI. Slightly
  yellower than Graphite 50 to evoke real printed paper. Used in exactly
  one place; documented here so it doesn't get "fixed" by a future agent
  trying to enforce neutral consistency.

### Named Rules

**The One Voice Rule.** Lamplight Indigo carries less than 10% of any given
screen's pixels. Its rarity is the entire point. Two indigo elements means
one of them needs to become a ghost button or a graphite chip.

**The Both-Themes Rule.** Every screen ships in light and dark from day
one. Dark mode is not a stretch goal or a launch-week follow-up. If a
component looks fine in light and broken in dark, the component is broken.

**The Off-Palette Receipt Rule.** Receipt Paper is deliberately off-palette
and stays that way. Do not "harmonize" it into the graphite family.

## 3. Typography

**Display & Body Font:** Geist Sans (loaded via `next/font/google` at
[layout.tsx:9](src/app/layout.tsx#L9), assigned to `--font-sans`). Geist's
slightly compressed proportions and high x-height read clearly at small
sizes on dense calendar grids and stay refined at hero scale. There is no
serif in this system; the previous Cormorant Garamond display type is
fully retired.

**Mono Font:** JetBrains Mono. Used for currency amounts (1.234,56 €), IDs,
booking codes, time stamps in the calendar gutter, and any tabular numerics
where alignment matters more than texture.

**Character:** the pairing is one calm sans for everything that reads as
language, and one disciplined mono for everything that reads as data. No
display serif. No script font. Geist's neutral character keeps focus on the
copy itself, in the same way Lume's color system keeps focus on the
operator's actual task.

### Hierarchy

Scale ratio ≥1.25 between adjacent steps so the hierarchy is felt, not
guessed.

- **Display** (Geist 600, `3.75rem` / 60px, line-height 1.2, tracking
  -0.02em): landing page heroes only. Never inside the admin app.
- **Headline** (Geist 600, `2.25rem` / 36px, line-height 1.2, tracking
  -0.02em): top-of-page titles in the admin (Calendar, Clienti, Fiches).
- **Title** (Geist 600, `1.5rem` / 24px, line-height 1.35): section
  headings inside a page (a panel, a modal title, a settings tab).
- **Body** (Geist 400, `1rem` / 16px, line-height 1.5): default running
  text. Cap line length at 65–75ch on prose surfaces (legal, marketing,
  long-form settings copy). Tables and dashboards exempt.
- **Label** (Geist 500, `0.6875rem` / 11px, line-height 1.35, tracking
  0.04em): metadata, table column headers, badge text. The smallest
  permitted size; arbitrary `text-[9px]`/`text-[10px]` are rejected on
  accessibility grounds and removed on contact.
- **Mono Body** (JetBrains Mono 400, `0.875rem` / 14px): currency, IDs,
  time gutters, anything tabular.

### Named Rules

**The Plain-Italian Rule.** UI copy is written in Italian. Use English only
when no native Italian word fits ("dashboard" is fine; "appuntamento" beats
"appointment"). No abbreviations in labels (write "appuntamento", never
"appt"). No jargon. Copy reads like a colleague speaking, not a software
menu.

**The Density Switch Rule.** Tables respect the global `data-density`
attribute on `<html>`. In compact mode, table body type drops to 13px and
row padding tightens. Never override this per-table; respect the user's
appearance preference.

**The 11-Pixel Floor.** No body text below 11px (`--text-2xs`). Anything
smaller fails accessibility for the 50-year-old salon owner who is the
target user.

## 4. Elevation

Lume is a **tonal-layering-first** system. Depth comes from the surface
behind a thing, not from a shadow under it. Light mode lifts surfaces by
walking up the graphite ramp (50 → 100 → white); dark mode lifts surfaces
by walking up the midnight ramp (148 → 192 → 232 → 295 for borders).
Shadows exist as a secondary signal, applied only to elements that float
above the page (popovers, dropdowns, modals, the hover-glow on `.btn-primary`).
Cards at rest are flat, separated from the surface behind them by tone and
border alone.

In dark mode, shadow alpha is pushed to 0.55 because diffuse shadows fall
off against dark surfaces and become invisible at 0.10. Light mode keeps
shadow alpha low (0.04 to 0.10) because the eye reads any darker shadow on
near-white as heavy.

### Shadow Vocabulary

- **xs** (`0 1px 1px 0 var(--shadow-color, rgb(0 0 0 / 0.04))`): the
  hairline lift on a hovered table row.
- **sm** (`var(--shadow-sm)`): cards that need to feel one tier above the
  page (`.shadow-elegant`).
- **md** (`var(--shadow-md)`): popovers, dropdowns,
  `.shadow-elegant-lg`, the on-hover lift of `.feature-card`.
- **lg** / **xl** (`var(--shadow-lg)` / `var(--shadow-xl)`): modals,
  side panels, the featured pricing card. Reserved for things that demand
  attention.

### Named Rules

**The Flat-By-Default Rule.** Cards at rest carry no shadow. They sit on
the page through tone and border. Shadows appear as a response to state
(hover, focus, raised over the page, modal-on-overlay) or to identify a
floating element (popover, dropdown). A static `box-shadow: var(--shadow-md)`
on a default card is wrong.

**The Tonal-First Rule.** When a designer wants to make something "stand
out", the first move is always tone, not shadow. Step the surface up one
ramp tier (Graphite 50 → Graphite 100, or Midnight Shell → Midnight Surface).
Reach for shadow only when tone has run out.

**The Dark-Mode-Shadow Doubling Rule.** Shadow color in dark mode is alpha
0.55, not 0.10. Light-mode shadow values copied unchanged into dark mode
will be invisible.

## 5. Components

Component philosophy in one phrase: **quietly tactile.** Every interactive
element confirms itself with one frame of feedback (a 1px lift, a border
shift, a soft accent-muted glow), never with a bouncy curve, never with a
shimmer pass, never with a scale transform that pushes past 1.02.

### Buttons

The intended button system lives in `globals.css` as utility classes
(`.btn-primary`, `.btn-secondary`) backed by semantic tokens. **Use these
when building screens.** A second, legacy `<FormButton>` exists in
[forms/FormButton.tsx](src/lib/components/shared/ui/forms/FormButton.tsx)
and uses gradients, raw `blue-500`, hover scale, and an inner shimmer
animation. It does not represent the system and should be migrated on
contact.

- **Shape:** `rounded-md` (8px). Pill buttons (`rounded-full`) are
  rejected; they evoke consumer apps, not professional tools.
- **Primary** (`.btn-primary`): solid Lamplight Indigo background, white
  text, 0.625rem / 1.25rem padding, weight 500. Hover: shifts to
  `--lume-button-accent-bg-hover`, lifts 1px, soft accent-muted shadow at
  8px blur. Active: returns to baseline Y, shifts to
  `--lume-button-accent-bg-active`. Mobile (≤768px): no Y-translate on
  active (touch devices can't see a 1px lift).
- **Secondary** (`.btn-secondary`): white background, graphite-950 text,
  1px graphite-200 border, same padding and weight. Hover: graphite-100
  background, border deepens to graphite-300, lifts 1px.
- **Destructive**: `--lume-button-destructive-bg` (Danger Red 500), white
  text. Same shape and padding as Primary. Used for deletions only;
  destructive actions must always offer undo, never confirm-modal-to-final.
- **Ghost**: transparent background, graphite-950 text, no border.
  Hover background: graphite-100. Used for tertiary toolbar actions
  inside a panel.

### Inputs / Fields

The intended input pattern is a borderless or 1px-bordered control on the
white surface, with the indigo focus ring as the only state signal. The
`<Searchbar>` component
([Searchbar.tsx](src/lib/components/shared/ui/Searchbar.tsx)) is the
canonical example: 1px border, rounded-lg, transparent background, focus
shifts the border to a darker graphite tone. The legacy `<FormInput>`
component ([FormInput.tsx](src/lib/components/shared/ui/forms/FormInput.tsx))
uses gradient borders, `border-2`, and `font-thin` labels — all off-spec
and to be migrated.

- **Style:** `rounded-md` (8px), 1px Graphite 200 border, white background.
  Padding 0.5rem / 0.75rem.
- **Placeholder:** Graphite 400.
- **Focus:** border shifts to Lamplight Indigo (`--lume-ring-focus`),
  inset focus ring (`--tw-ring-inset: inset` is forced in
  [globals.css:480](src/app/globals.css#L480) so the ring never gets
  clipped by an `overflow: hidden` parent like a modal).
- **Error:** border shifts to Danger Red 500. The error message renders
  below with a 16px alert icon and the message text together (color is
  never the only signal).
- **Disabled:** opacity 50%, background Graphite 50.

### Cards / Containers

- **Corner Style:** `rounded-lg` (12px) for default cards;
  `rounded-xl` (16px) for pricing cards; `rounded-2xl` (24px) for hero
  panels.
- **Background:** white in light mode (`--lume-surface-raised`),
  Midnight Surface in dark.
- **Border:** 1px Graphite 200 in light, Midnight Border in dark.
- **Shadow Strategy:** none at rest. `.feature-card`'s hover lift adds a
  soft accent-muted glow plus `var(--shadow-md)`. Pricing card "featured"
  variant adds `var(--shadow-xl)` and an indigo border ring.
- **Internal Padding:** 1.5rem default; 2rem for pricing cards. Match the
  card's importance.
- **Nested cards are forbidden.** A card inside a card is always a layout
  failure. Use a section divider, a tonal step, or nothing.

### Chips

- **Style:** Graphite 100 background, Graphite 700 text, `rounded-sm`
  (4px), label typography (11px, tracking 0.04em), `0.125rem 0.5rem`
  padding.
- **State:** selected chips swap background to Lamplight Indigo Soft,
  text to Lamplight Indigo. No border.
- **Used for:** tag filters, table column toggles, calendar service
  category labels.

### Navigation

- **Sidebar** (`--sidebar`): Graphite 50 in light, Midnight Surface in
  dark. Items use body typography (16px, weight 400). Active item
  background: Graphite 100 (light) / accent-muted (dark). Active item
  text: Graphite 950 (light) / Lamplight Indigo (dark). The active
  marker is a tonal background shift, never a side-stripe border.
- **Mobile:** the sidebar collapses to a bottom-anchored sheet on
  ≤768px, never a hamburger drawer that hides primary navigation.

### Calendar Grid (Signature Component)

The calendar is the home. Its visual treatment defines the system more
than any other surface.

- **Time gutter:** JetBrains Mono labels, Graphite 600 in light,
  Midnight Text Secondary in dark. Right-aligned; trailing edge sits 12px
  from the grid line.
- **Hour rows:** 1px Graphite 200 / Midnight Border separators. Half-hour
  rows: 1px dashed at 0.5 opacity.
- **Appointments:** `rounded-md` (8px), tonal fill matching the operator
  or service category, `--lume-text` on light fills, white on dark fills.
  The selected appointment swaps its fill to Lamplight Indigo and lifts
  with `var(--shadow-md)`. Drag-to-move and resize use the
  `--ease-out-quart` curve at 200ms.
- **Conflict state:** danger-red 4px ring around the conflicting
  appointment, plus a danger-red icon in its top-right corner. Never red
  alone.
- **Empty calendar day:** centered EmptyState with a "Crea il primo
  appuntamento" button. No empty space without a next-action prompt.

### Empty State

The current `<EmptyState>` component
([EmptyState.tsx](src/lib/components/shared/ui/EmptyState.tsx)) shape is
correct: dashed Graphite 300 border, Graphite 50 background, large icon
in Graphite 300, title in Graphite 700, description in Graphite 500,
primary action button below. **It currently uses raw `bg-zinc-*` and
`text-zinc-*` utilities instead of semantic tokens.** Migrate to
`bg-surface`, `text-secondary`, `border-flat` so dark mode tracks.

## 6. Do's and Don'ts

### Do:

- **Do** use `.btn-primary` and `.btn-secondary` from
  [globals.css](src/app/globals.css) for every button in the admin app.
  They are the source of truth.
- **Do** route every color, surface, border, and text decision through
  the `--lume-*` semantic layer. Components must never reference
  `--color-brand-primary-500` or `oklch(...)` directly.
- **Do** treat Lamplight Indigo as a rare event. If a screen has more
  than one indigo element, demote one to ghost or graphite.
- **Do** ship every component in light and dark from day one. Dark mode
  is not a follow-up.
- **Do** use tonal layering before reaching for shadow. Step the surface
  up a tier first.
- **Do** write UI copy in Italian, in the voice of a colleague speaking,
  not a software menu.
- **Do** push shadow alpha to 0.55 in dark mode. Lower values are
  invisible against the midnight surfaces.
- **Do** pair every status color with an icon and text. Color is never
  the only signal (operator color-blindness assumption holds).
- **Do** preserve the Receipt Paper aesthetic on Fiche surfaces. The
  off-palette warm white is intentional.

### Don't:

- **Don't** use the legacy `<FormButton>` or `<FormInput>` for new
  screens. They use blue gradients, `border-2`, hover scales, and inner
  shimmer animations that are forbidden by this system. Migrate them
  on contact rather than copying their patterns.
- **Don't** apply `bg-gradient-to-r` to buttons, cards, or any UI
  surface. The only sanctioned gradients are
  `--lume-gradient-hero` (landing page background) and
  `--lume-gradient-accent` (decorative use only, see the next item).
- **Don't** use `.gradient-text` (defined in
  [globals.css:328](src/app/globals.css#L328)). Animated gradient text
  is rejected; emphasis comes from weight and size, not from
  `background-clip: text`. The class exists for legacy reasons; remove on
  contact.
- **Don't** use raw `zinc-*`, `blue-*`, `red-*`, `slate-*` Tailwind
  utilities. Those are the drift that the token system replaced. Use
  semantic Lume utilities (`bg-surface`, `text-secondary`,
  `border-flat`) or extend the semantic layer.
- **Don't** use `border-left` or `border-right` greater than 1px as a
  colored accent on cards, list items, callouts, or alerts. Side-stripe
  borders are forbidden. Use full borders, background tints, or leading
  icons instead.
- **Don't** nest cards. A card inside a card is a structural failure.
- **Don't** use modals as the first answer for any flow. Exhaust inline
  and progressive options first; `<Modal>` is reserved for genuinely
  blocking decisions.
- **Don't** use `--text-[9px]`, `--text-[10px]`, or arbitrary
  pixel-sized text utilities below 11px. The 11-pixel floor is
  non-negotiable.
- **Don't** ship with a bouncy spring or elastic easing. Use
  `--ease-out` (quartic) or `--ease-in-out` from
  [primitives.css:96](src/styles/tokens/primitives.css#L96). No
  `cubic-bezier(...)` literals in component files.
- **Don't** reproduce any of the Anti-references named in
  [PRODUCT.md](PRODUCT.md): no Treatwell-Stiv-Area-Salon density, no
  pink/gold luxury-salon brochure aesthetic, no resurrected `--salon-*`
  Synergia tokens, no shadcn-card-on-cream generic SaaS template.
- **Don't** sit a dark surface on `#000`. Use Midnight Shell
  (`oklch(0.148 0.007 265)`) at minimum. Pure black causes optical
  vibration against the indigo accent and reads as cheap.
