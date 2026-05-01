<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes, APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:design-context -->
# Design context

Before writing or modifying any UI (component, page, route, CSS), read both:

- [PRODUCT.md](PRODUCT.md), the strategic layer: register, users, brand personality, anti-references, design principles, accessibility priority order. Five principles guide every decision: *Obvious beats clever*, *The calendar is the home*, *Plain Italian, every word*, *Quiet by default, loud when it matters*, *Trust the user, don't quiz them*.
- [DESIGN.md](DESIGN.md), the visual layer (Stitch format, YAML frontmatter + six fixed sections): the Lamplight Indigo + Brass Amber + Graphite OKLCH palette, Geist + JetBrains Mono typography, four-tier dark-mode elevation ramp, button/input/card/chip/nav specs, and forceful Do's and Don'ts. The accompanying [DESIGN.json](DESIGN.json) sidecar carries tonal ramps, motion tokens, full component HTML/CSS snippets, and narrative metadata.

Both files are normative. The strategic line in PRODUCT.md flows directly into the visual rules in DESIGN.md (every PRODUCT anti-reference reappears as a DESIGN don't). When a UI change conflicts with either file, fix the change, not the document. To update them, run `$impeccable teach` (PRODUCT.md) or `$impeccable document` (DESIGN.md / DESIGN.json) so the rewrite goes through the same interview and validation flow that produced the originals.

Token system source-of-truth lives at [src/styles/tokens/](src/styles/tokens/) (palette → primitives → semantic). Components must reference the `--lume-*` semantic layer, never raw `--color-*` palette variables and never raw Tailwind `zinc-*` / `blue-*` / `red-*` utilities.
<!-- END:design-context -->
