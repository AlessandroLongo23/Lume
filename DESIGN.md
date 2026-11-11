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
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "'Geist', 'Helvetica Neue', sans-serif"
    fontSize: "1.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Geist', 'Helvetica Neue', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.02em"
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
    fontFamily: "'Geist Mono', 'Menlo', monospace"
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

- **Quietly exact.** Borrowed from EDL's tool work (edl.dk, edl-docs):
  control edges are 1px shadow rings, hover and selection are translucent
  overlays of the text colour, one highlight glides between items, a press
  shrinks the control a hair. Every interaction confirms itself without
  theatrics. No lift, no glow, no bouncy elastic, no shimmer passes.
- **Indigo means "act", not "chosen".** Lamplight Indigo carries primary
  actions, the focus ring, the one selected appointment, the one active
  alert. Selected nav items, tabs, segments and chips are a neutral
  overlay with full-strength text. Everywhere else lives in graphite
  neutrals. A screen with three indigo elements is a screen with a bug.
- **Type carries hierarchy, not weight.** Headings are weight 500 with
  tight tracking; size and space do the rest. Numbers are mono and
  tabular wherever they appear.
- **Two themes, both first-class.** Light mode is the default for daytime
  reception PCs. Dark mode is built deliberately, not as a tinted inversion:
  a four-tier elevation ramp lifted off pure black, hue 265 carried through
  for "indigo-tinted graphite", chromatic feedback borders, shadow alpha
  pushed to 0.55 so depth stays visible.
- **Italian throughout.** Geist Sans (Western Latin glyph set), with
  tabular figures for prices and IDs, dates and currencies in Italian formatting. No
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

**Numbers:** Geist with tabular figures (`tabular-nums`), never a monospaced
font. Currency amounts (1.234,56 €), IDs, booking codes, time stamps in the
calendar gutter and table figures stay in the UI font; fixed-width digits keep
columns aligned. **Mono Font:** Geist Mono, for code only (secrets, branch
names, inline code in articles).

**Character:** the pairing is one calm sans for everything that reads as
language, and one disciplined mono for everything that reads as data. No
display serif. No script font. Geist's neutral character keeps focus on the
copy itself, in the same way Lume's color system keeps focus on the
operator's actual task.

### Hierarchy

Scale ratio ≥1.25 between adjacent steps so the hierarchy is felt, not
guessed.

- **Display** (Geist 500, `3.75rem`+ / 60px+, line-height 1.1, tracking
  -0.03em): landing page heroes only. Never inside the admin app.
- **Headline** (Geist 500, `1.75rem` / 28px, line-height 1.2, tracking
  -0.02em): top-of-page titles in the admin (`<PageHeader>`). No icon
  tile beside it.
- **Title** (Geist 500, `1.25rem` / 20px, line-height 1.3, tracking
  -0.02em): section headings inside a page (a panel, a modal title, a
  settings tab).
- **Body** (Geist 400, `1rem` / 16px, line-height 1.5): default running
  text. Cap line length at 65–75ch on prose surfaces (legal, marketing,
  long-form settings copy). Tables and dashboards exempt.
- **Label** (Geist 400–500, `0.75rem` / 12px, line-height 1.35, sentence
  case, no letter-spacing): metadata, table column headers, sidebar group
  titles, badge text. Uppercase tracked labels are retired. The smallest
  permitted size; arbitrary `text-[9px]`/`text-[10px]` are rejected on
  accessibility grounds and removed on contact.
- **Numeric** (Geist 400 with `tabular-nums`, the size of its context):
  currency, IDs, time gutters, anything tabular. Geist Mono only for code.

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
above the page (popovers, dropdowns, modals, the command palette).
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
  `.shadow-elegant-lg`.
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

Component philosophy in one phrase: **quietly exact.** Every interactive
element confirms itself with one frame of feedback (an overlay fill, an
edge that darkens, a 0.98 press), never with a lift or glow, never with a
bouncy curve, never with a shimmer pass, never with a scale transform that
pushes past 1.02.

### Surfaces, edges and overlays

Tokens in [semantic.css](src/styles/tokens/semantic.css), exposed as
Tailwind utilities in [globals.css](src/app/globals.css). Each rule below is
implemented ONCE, as a recipe in
[components.css](src/styles/components.css) (`control`, `surface-card`,
`surface-float`, `selected`, `marker-current`, `list-row`) and in the
components of [shared/ui](src/lib/components/shared/ui/README.md). Screens
are built from those components; a screen that hand-writes one of these
looks is a bug. The README is the catalog of which component does which
job.

- **The Overlay Ladder.** `--lume-hover` (pointer is here), `--lume-active`
  (selected or pressed), `--lume-strong` (hover on selected) are the text
  colour at 4/7/10% (light) or 6/10/14% (dark). Because they are
  translucent they read on every surface step. Use them for every hover
  and selection fill instead of a fixed grey.
- **The Edge Rule.** A control's outline is an INSET ring, `box-shadow:
  inset 0 0 0 1px var(--lume-edge)`, never a CSS border and never an outer
  ring: an outer ring is clipped by any scrolling parent (modal bodies), and
  a border changes the box. Hover darkens it to `--lume-edge-hover`; focus
  turns it indigo with a 3px inner `--lume-accent-muted` halo. Fields get
  all of this from the `control` recipe.
- **The One-Selected Rule.** "This one is chosen" has one look everywhere:
  the `selected` recipe (`--lume-active` fill, full-strength text, weight
  500) on nav rows, tabs, segments, list options, date cells and chips.
  "Today / current" without being chosen is `marker-current` (a ring, no
  fill). Checkboxes and switches fill with the text colour. Inverted dark
  chips and indigo washes as selection are retired.
- **The Hairline Rule.** Dividers between rows and sections are 1px
  `--lume-line` (text at 8%). Cards at rest sit on a `--lume-line` shadow
  ring, no drop shadow.
- **The Float Rule.** Menus, popovers, selects, dialogs and the command
  palette use `--lume-surface-raised` plus `shadow-float` (a faint ring
  and a soft drop), no CSS border. Tooltips are inverted chips (text
  colour as the fill).
- **The Glide Rule.** Segmented toggles (`<ToggleButton>`), tabs
  (`<TabBar>`/`<TabButton>`) and the sidebar share one selected fill that
  slides to the new item: `--duration-glide` 180ms, `--ease-glide`
  `cubic-bezier(0.2, 0, 0, 1)` (the sidebar uses the spring below).
  Reduced motion snaps.
- **The Hover-Glide Rule.** In any list of rows (sidebar, menus, selects,
  the command palette, toggles, tabs) hover is ONE highlight that follows
  the pointer from row to row, fading in where the pointer enters, not a
  fill on each row. It also follows keyboard focus and arrow-key
  highlight. Built once in
  [useHoverGlide.ts](src/lib/hooks/useHoverGlide.ts) plus the
  `.hover-glide` class; rows drop their own hover background. In toggles
  and tabs it is born at the selected item and hides over it. Motion is
  `--ease-spring` over `--duration-spring` (500ms): EDL's measured spring
  (stiffness 500, damping 36), 1.4% overshoot. It is the only spring in
  the system and is reserved for this highlight and the sidebar's
  selected fill; never for layout, entrances or the calendar grid.
  Reduced motion keeps only the fade.
- **The State-Dot Rule.** Success, warning and danger appear as a small
  dot or icon beside a neutral word, not as pastel-tinted pills or
  coloured text blocks. Colour is never the only signal.
- **The Identity-Colour Rule.** Quiet is not colourless. Colour that helps
  recognition stays, as soft tokenised tints: per-client and per-operator
  avatar tints, service and category hues on appointments, chart series,
  coloured icons where they speed up scanning. Product previews on the
  landing page show the app in full colour, never as grey wireframes.
  What the rules above restrict is indigo (actions and focus only) and
  status colour (dots beside words).

### Control Sizing (the toolbar baseline)

Every control that sits in a toolbar — buttons, inputs, searchbars, segmented
toggles, dropdown triggers, column pickers, the theme toggle — aligns on a
single height. They are the same family of object; mixing 32 / 36 / 38 / 40
breaks the rhythm of the page header.

The token lives in [primitives.css](src/styles/tokens/primitives.css) under
`--lume-control-h-*` and pairs with `--lume-control-px-*`,
`--lume-control-text-*`, `--lume-control-gap-*`. Three sizes, one purpose
each:

| Size | Height | Use |
|---|---|---|
| **sm** | 32px (`--lume-control-h-sm`) | Inline filters inside a table row, compact density mode, secondary actions in dense panels. |
| **md** | **36px** (`--lume-control-h-md`) — **default** | Every page-header toolbar across the admin app. Searchbar, primary action, three-dots, view toggle, theme toggle, column picker, table toolbar. |
| **lg** | 44px (`--lume-control-h-lg`) | Landing-page CTAs, onboarding primaries, mobile touch targets (PRODUCT.md mandates ≥44px). Never inside the admin shell. |

Five rules:

1. **The 36-Pixel Rule.** A toolbar mixes `md` and only `md`. If a toolbar
   visually mixes heights, one of the controls is bypassing the token.
   Migrate it before shipping.
2. **The Token-Or-Primitive Rule.** A new control reads `--lume-control-h-md`
   directly, OR delegates to a primitive that does — `<Button>`,
   `<Searchbar>`, `<ToggleButton>`, `<DropdownMenu>`. Raw `h-9` / `h-10` /
   `size-9` / `py-2` heights on toolbar controls are forbidden.
3. **The Single-Searchbar Rule.** `<Searchbar>` is the only searchbar
   primitive. Pass `value` + `onChange` for local-state filters (table
   toolbars, grid filters); omit them for the global cmd+K searchbar.
   Never re-implement an `<input>` with a leading search icon — it always
   drifts in height, padding, or focus colour.
4. **The Icon-Only Square Rule.** An icon-only control is square: width =
   `--lume-control-h-md`, padding 0, 16px lucide icon. The theme toggle, the
   three-dots menu, the close-search "×" all follow this.
5. **The Lg-Off-Limits Rule.** Inside `/admin/*`, never use `lg`. The
   reception PC is the daily driver and 36 is the comfortable density there.
   `lg` is reserved for landing pages and the mobile booking surface.

### Buttons

The button system is the `<Button>` primitive at
[Button.tsx](src/lib/components/shared/ui/Button.tsx). It owns variant,
size, icon-only, leading/trailing icons, loading state, and the focus ring.
Reach for it before writing a styled `<button>`. A legacy `<FormButton>`
([forms/FormButton.tsx](src/lib/components/shared/ui/forms/FormButton.tsx))
exists with gradients, raw `blue-500`, hover scale, and an inner shimmer —
off-spec; migrate on contact.

- **Shape:** `rounded-lg` (8px). Pill buttons (`rounded-full`) are
  rejected; they evoke consumer apps, not professional tools.
- **Sizing:** see *Control Sizing* above. `size="md"` is the toolbar
  default (36px); the Button primitive consumes `--lume-control-h-md`,
  `--lume-control-px-md`, `--lume-control-text-md`, `--lume-control-gap-md`
  in lock-step.
- **Primary** (`<Button variant="primary">`): solid Lamplight Indigo
  background, white text, weight 500. Hover: shifts to
  `--lume-button-accent-bg-hover`. Press: `--lume-button-accent-bg-active`
  and scale 0.98. No lift, no glow.
- **Secondary** (`<Button variant="secondary">`): control background,
  graphite-950 text, `--lume-edge` shadow ring. Hover: graphite-100
  background. The default for toolbar tertiary actions, three-dots
  triggers, theme toggles.
- **Destructive** (`<Button variant="destructive">`):
  `--lume-button-destructive-bg` (Danger Red 500), white text. Same shape
  as Primary. Used for deletions only; destructive actions must always
  offer undo, never confirm-modal-to-final.
- **Ghost** (`<Button variant="ghost">`): transparent background,
  secondary text, no edge. Hover: `--lume-hover` fill and full-strength
  text. Used for tertiary toolbar actions inside a panel.

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

- **Style:** `rounded-lg` (8px), `--lume-edge` shadow ring (no border),
  control background. Padding 0.5rem / 0.75rem. Hover darkens the edge.
- **Placeholder:** Graphite 400.
- **Focus:** the edge turns Lamplight Indigo (`--lume-ring-focus`) with a
  4px `--lume-accent-muted` halo. Native rings stay inset (`--tw-ring-inset: inset` is forced in
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
- **Edge:** a `--lume-line` shadow ring (see The Hairline Rule), no CSS
  border. Clickable cards darken the ring to `--lume-edge-hover` on hover.
- **Shadow Strategy:** none at rest, no hover lift. The featured pricing
  card is marked by an indigo ring and the only indigo button.
- **Internal Padding:** 1.5rem default; 2rem for pricing cards. Match the
  card's importance.
- **Nested cards are forbidden.** A card inside a card is always a layout
  failure. Use a section divider, a tonal step, or nothing.

### Chips

- **Style:** Graphite 100 background, Graphite 700 text, `rounded-sm`
  (4px), label typography (11px, tracking 0.04em), `0.125rem 0.5rem`
  padding.
- **State:** selected chips swap to `--lume-active` with full-strength
  text. No border, no indigo.
- **Used for:** tag filters, table column toggles, calendar service
  category labels.

### Navigation

- **Sidebar** (`--sidebar`): Graphite 50 in light, Midnight Surface in
  dark. Items use 14px, weight 400, secondary text. The active item is
  `--lume-active` with full-strength text and a 2px icon stroke (1.5 at
  rest), the same in both themes; the fill glides to the new page. Group
  titles are 12px sentence case in muted text. The active marker is a
  tonal background shift, never a side-stripe border or an indigo wash.
- **Mobile:** the sidebar collapses to a bottom-anchored sheet on
  ≤768px, never a hamburger drawer that hides primary navigation.

### Calendar Grid (Signature Component)

The calendar is the home. Its visual treatment defines the system more
than any other surface.

- **Time gutter:** Geist labels with tabular figures, Graphite 600 in light,
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

- **Do** use `<Button>` ([Button.tsx](src/lib/components/shared/ui/Button.tsx))
  for every button in the admin app, `<TabBar>` for tabs and
  `<ToggleButton>` for segmented choices. They are the source of truth.
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
- **Don't** ship with a bouncy spring or elastic easing (the single
  exception is the near-critical `--ease-spring` of the Hover-Glide Rule).
  Use `--ease-out` (quartic) or `--ease-in-out` from
  [primitives.css:96](src/styles/tokens/primitives.css#L96). No
  `cubic-bezier(...)` literals in component files.
- **Don't** reproduce any of the Anti-references named in
  [PRODUCT.md](PRODUCT.md): no Treatwell-Stiv-Area-Salon density, no
  pink/gold luxury-salon brochure aesthetic, no resurrected `--salon-*`
  Synergia tokens, no shadcn-card-on-cream generic SaaS template.
- **Don't** sit a dark surface on `#000`. Use Midnight Shell
  (`oklch(0.148 0.007 265)`) at minimum. Pure black causes optical
  vibration against the indigo accent and reads as cheap.
