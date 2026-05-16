// Public booking app brand-color injection.
//
// Owners pick a single hex color in BrandingPanel; the public salon page
// derives hover/active/light/muted variants from it via CSS `color-mix(in
// oklch, ...)` so a salon's accent flows through buttons, focus rings, chips,
// and selection backgrounds without any extra owner input.
//
// Mechanism mirrors how ThemeProvider swaps the light/dark token set: we
// write a `<style>` tag that re-declares a handful of `--lume-*` semantic
// vars on `:root`. The admin app never sees this style tag.

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * CSS string that overrides `--lume-accent` and the derivatives the public
 * booking surface visibly uses. Returns null when the hex is missing or
 * malformed so the caller can skip rendering the `<style>` tag entirely.
 */
export function getBrandStyleCSS(brandColor: string | null | undefined): string | null {
  if (!brandColor) return null;
  const hex = brandColor.trim();
  if (!HEX_RE.test(hex)) return null;

  return `:root {
  --lume-accent: ${hex};
  --lume-accent-dark: color-mix(in oklch, ${hex} 88%, black);
  --lume-accent-light: color-mix(in oklch, ${hex} 12%, white);
  --lume-accent-muted: color-mix(in oklch, ${hex} 12%, transparent);
  --lume-border-accent: ${hex};
  --lume-button-accent-bg: ${hex};
  --lume-button-accent-bg-hover: color-mix(in oklch, ${hex} 88%, black);
  --lume-button-accent-bg-active: color-mix(in oklch, ${hex} 76%, black);
  --lume-ring-focus: ${hex};
  --lume-selection: color-mix(in oklch, ${hex} 18%, white);
}`;
}
