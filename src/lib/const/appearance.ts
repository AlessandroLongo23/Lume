/**
 * Standard card container styling — routes through the design token system
 * (shadcn bridge tokens → Lume semantic → OKLCH palette). Edit one palette
 * value in src/styles/tokens/palette.css and every table that imports this
 * updates automatically.
 */
export const cardStyle =
  'bg-card border border-border rounded-xl shadow-sm transition-all hover:shadow-md';
