/**
 * JS mirror of the motion tokens in src/styles/tokens/primitives.css, for
 * `motion` transitions that cannot read CSS variables. Keep the two in sync.
 */

/** `--ease-out`: entrances and responses to a user action. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** `--ease-in-out`: something moving between two on-screen positions. */
export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;

/** `--duration-fast` / `--duration-base` / `--duration-slow`, in seconds. */
export const DURATION = {
  fast: 0.12,
  base: 0.2,
  slow: 0.32,
} as const;
