# Design-system checks

Static checks that measure how much of Lume is built from its own components and tokens, and stop
new code from drifting away from them. They read `src/` as text (no build, no browser) and run in
about two seconds.

```sh
npm run ds:check                   # gates: exit 2 on violations the baseline does not know
npm run ds:check -- --all          # list the known violations too
npm run ds:check -- --rule portal  # one rule
npm run ds:check -- --all --file src/lib/components/shell/   # one path prefix
npm run ds:baseline                # record the current violations as known
npm run ds:report                  # metrics and gate totals
npm run ds:report -- --json        # the same as JSON
```

`npm run check` runs `ds:check` after tsc and eslint, and a Stop hook in `.claude/settings.json`
runs it after every Claude Code turn: new violations send the turn back with the list (once per
turn, so it cannot loop).

The method follows EDL's checks suite: a check that blocks (a gate) only where a violation reliably
means something is wrong and the fix is clear; everything else is a metric, a number to watch that
never fails. A legacy codebase starts from a baseline.

## What the checks read

| Kind | Files | Judged by |
|---|---|---|
| token | `src/styles/tokens/*.css`, `src/styles/components.css`, `src/app/globals.css` | `unknown-token` only: literals belong here |
| design system | `src/lib/components/shared/ui/**`, `src/components/ui/**`, and any file with a sibling `.stories.tsx` (what the docs site documents) | every value gate |
| app | everything else under `src/` | every gate, plus `native-element` and `third-party-ui` |
| story | `*.stories.tsx` | nothing; they count only for story coverage |
| exempt | `EXEMPT` in `scan.ts`: email HTML, route handlers, printed documents, exports, OG images, generated types, colour data | `unknown-token` only |

Components are matched through imports, so recharts' `<Tooltip>` is never counted as Lume's.

## Gates

| Rule | Flags | Leaves alone |
|---|---|---|
| `raw-color` | hex, `rgb()`, `hsl()`, `oklch()` and similar literals; named colours in stylesheets | `var(--x, #fff)` fallbacks, `readVar(…) \|\| '#…'` fallbacks, SVG `fill`/`stroke` attributes, fully transparent colours, black or white stops in a mask gradient, computed colours, `#123` after a word ("Ordine #123") |
| `palette` | palette steps used directly: Tailwind's stock palette (`bg-zinc-100`, `text-white`) and every entry of `palette.css` (`bg-neutral-100`, `bg-midnight-shell`, `var(--color-danger-500)`, `getPropertyValue('--color-danger-400')`) | the semantic utilities (`bg-hover`, `text-success-strong`) |
| `bridge` | the shadcn bridge (`bg-card`, `text-primary`, `var(--background)`, `getPropertyValue('--chart-1')`), due to go in Phase C | `src/components/ui/`, which still needs it |
| `token-spelling` | `bg-[var(--lume-hover)]` where the theme defines a utility for that token (`bg-hover`, `border-line`, `text-danger-strong`): the same CSS, spelled two ways | tokens without a utility (`text-[var(--lume-text-secondary)]`), and `shadow-[…]`, where Tailwind reads a variable as a whole shadow |
| `unknown-token` | `var(--x)` where nothing defines `--x`: no stylesheet, no style object, no `setProperty`, no next/font variable | variables Tailwind, Base UI and Radix set at runtime |
| `z-index` | `z-10`, `z-[60]`, `zIndex: 5`, `z-index: 1` | `z-0`, and the named tiers |
| `portal` | a file that uses a floating tier (`z-dropdown` … `z-drag`) and never portals | `<Portal>`, `createPortal`, Base UI's `<X.Portal>`, d3 appending to `document.body`; `FloatingPanel`, whose caller portals it |
| `raw-motion` | `duration-200`, `duration-[0.2s]`, `cubic-bezier(…)`, `transition: … 200ms`, and in files that import motion or gsap, `duration: 0.2` and `ease: [ … ]` | zero durations, easing keywords, `delay`, lines inside `prefers-reduced-motion: reduce` |
| `raw-size` | arbitrary font size, line height, letter spacing, weight, radius, spacing and shadow with a literal (`text-[13px]`, `rounded-[7px]`); the same in style props and stylesheets | layout sizes (`w-[16%]`, `grid-cols-[…]`, `max-w-[60ch]`), values built from `var()`, `env()` or `calc()` with a token |
| `native-element` | in app code: `<button>`, `<input>` by type, `<select>`, `<textarea>`, `<label>`, `<dialog>`, `<h1>` on admin pages, underlined `<a>`/`<Link>`, admin data `<table>`s that skip `tableStyles`, a click handler on a `<div>` or `<span>`, a `title` attribute | inputs no component covers (`file`, `hidden`, `color`), a `<label>` around a Checkbox or Switch (a library gap, reported by the metrics), a click handler that only stops propagation, an element with an explicit `role` |
| `third-party-ui` | a screen importing `@base-ui/react` or `@radix-ui/*` | the library itself |
| `ds-ignore` | a `ds-ignore` comment without a reason | |

Hints name the replacement where the checks can tell: the token with that exact value, the nearest
step, or the component.

## Baseline and ignores

`.ds-baseline.json` holds the known violations. A violation is matched by its rule, its value and the
text of its source line, never by file or line number, so moving code does not fail and replacing
one violation with another does. When a passing check finds fewer violations than recorded, it
rewrites the baseline with what is left; fixed violations cannot come back unnoticed.

To accept one line, put `ds-ignore: <reason>` on it or on the line above (`{/* ds-ignore: QR codes
need a white quiet zone */}` in JSX). For an element whose opening tag spans several lines, the
comment may also sit inside the tag, as its own `// ds-ignore: …` line between attributes. The
pattern metrics honour the same comment, and a `*Badge.tsx` or `*Picker.tsx` kept local on purpose
takes one in its first 15 lines. An ignore without a reason is a violation of its own. For a rule
that never applies to a whole file, add an entry to `ALLOW` in `scan.ts` with the reason; for a
file that is not screen code at all, to `EXEMPT`.

## Metrics (`ds:report`)

- Component adoption: library uses against native elements a component replaces, per component
  and per product area (`areaOf` in `scan.ts`). A click handler on a `<div>` counts as a native
  button. `tableStyles` counts the tables in files that import it. Reach is the share of files that
  render HTML and import anything from the library or use a recipe.
- Token coverage: for colour, type, spacing, radius, shadow, z-index and motion, the share of
  values that come from a token. The off-system side is the gate findings, so the two never disagree.
  It also counts half spacing steps (2, 6, 10px).
- Library: story coverage, components nothing uses, components only the library uses.
- Overrides: share of instances that carry `className` or `style`, and the share whose classes
  change the look. Read it as a pointer to components that may lack a prop, not a score.
- Hand-rolled patterns: the "Not" column of `shared/ui/README.md` (row hovers, hand-made cards and
  floating surfaces, key switches, Button restyles) and checkbox rows, which no component covers yet.
- Local components named for a role (`*Badge`, `*Modal`, `*Picker`, …) that do not import the
  library piece for that role: candidates to replace or to promote.
- Token layer: definitions per file, semantic tokens holding literals (a `color-mix()` of a palette
  step is not one), tokens pointing at Tailwind's stock palette, colour tokens with one value for
  both themes, `--lume-*` tokens nothing reads, references to undefined tokens, and whether
  Tailwind's stock palettes still compile. They do on purpose: `@tailwindcss/forms` and
  `@tailwindcss/typography` resolve stock colours, so resetting them (`--color-*: initial`) could
  break inputs and prose; the `palette` gate keeps them out of the code instead.
- Escape hatches: ignores, `ALLOW` entries, exempt files, baseline size, important modifiers,
  `dark:` variants (with semantic tokens, a `dark:` override usually marks a missing token).

## Blind spots

The checks read source text. They do not see class names built at runtime from parts, styles set
from JS on elements created outside JSX (d3 builds its own nodes), or a value that is wrong in the
rendered page but right in the source. A component passed by reference (`icon={Button}`) is not
counted as a use.
