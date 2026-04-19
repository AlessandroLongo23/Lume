/**
 * Shared category-color constants.
 *
 * These are DATA values (user picks a color to label a category) — they are
 * intentionally outside the design-token system. Themes should not change
 * the meaning of a user-chosen color.
 */

/** Fallback when a category record has no color assigned. Matches the Lume
 *  brand primary indigo so categorized items still read as "Lume" by default. */
export const DEFAULT_CATEGORY_COLOR = '#6366F1';

/** Curated 12-color palette offered in the category-create/edit picker.
 *  Subset of paletteSwatches chosen for good visual separation + contrast
 *  on both light and dark surfaces. */
export const CATEGORY_PICKER_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#10B981', '#14B8A6', '#06B6D4', '#3B82F6',
  '#6366F1', '#8B5CF6', '#EC4899', '#6B7280',
] as const;
