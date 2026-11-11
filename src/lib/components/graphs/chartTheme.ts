/*
 * Shared chart styling. Axes and grid stay recessive (muted ink, hairline
 * grid, no axis lines); colour is spent on the data.
 */
export const AXIS_TICK = { fontSize: 11, fill: 'var(--lume-text-muted)' } as const;
export const GRID_STROKE = 'var(--lume-line)';
export const CURSOR_FILL = { fill: 'var(--lume-hover)' } as const;

/** Single-series colour: the same validated indigo as Bilancio's "Entrate". */
export const SERIES_PRIMARY = 'var(--lume-chart-entrate)';
/** Second series when two measures sit side by side (brass amber 700). */
export const SERIES_SECONDARY = 'var(--lume-chart-uscite)';
/** The "Altre" slice that collects everything past the coloured slots. */
export const SERIES_OTHER = 'var(--lume-text-muted)';

/*
 * Categorical order for donuts, validated with the dataviz palette checker
 * (all pairs, since every slice can touch every other):
 *   light on #FFFFFF: indigo 500, brass 700, aqua (--lume-chart-3). CVD ΔE ≥ 11.6,
 *     normal-vision ΔE ≥ 19.7; aqua is 2.8:1, so every donut lists its values
 *     beside it (the relief rule).
 *   dark on the zinc-900 panel: same indigo and brass, a darker aqua. CVD ΔE ≥ 9.7.
 * A fourth hue fails the all-pairs floors in dark mode, so donuts show three
 * coloured slices and fold the rest into "Altre". All three are CSS variables,
 * so a chart follows the theme of the element it renders in.
 */
export const CATEGORICAL_COLORS = [SERIES_PRIMARY, SERIES_SECONDARY, 'var(--lume-chart-3)'] as const;

export const MAX_COLOURED_SLICES = 3;

/** Keeps the largest slices and sums the rest into one "Altre" slice. */
export function foldSlices<T extends { name: string; value: number }>(
  data: T[],
  otherLabel = 'Altre',
): { name: string; value: number }[] {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  if (sorted.length <= MAX_COLOURED_SLICES + 1) return sorted.map(({ name, value }) => ({ name, value }));
  const head = sorted.slice(0, MAX_COLOURED_SLICES).map(({ name, value }) => ({ name, value }));
  const rest = sorted.slice(MAX_COLOURED_SLICES).reduce((sum, d) => sum + d.value, 0);
  return [...head, { name: otherLabel, value: rest }];
}

/** Axis ticks stay on one line: "16,5k €". */
export const compactEuro = (v: number) =>
  Math.abs(v) >= 1000
    ? `${(v / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })}k €`
    : `${v.toLocaleString('it-IT')} €`;
