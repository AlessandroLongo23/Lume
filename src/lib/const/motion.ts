/**
 * JS mirror of the motion tokens in src/styles/tokens/primitives.css, for
 * `motion` transitions that cannot read CSS variables. Keep the two in sync.
 */

/** `--ease-out`: entrances and responses to a user action. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** `--ease-in-out`: something moving between two on-screen positions. */
export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;

/** `--ease-glide`: a selection highlight sliding between items. */
export const EASE_GLIDE = [0.2, 0, 0, 1] as const;

/** `--duration-glide`, in seconds. */
export const DURATION_GLIDE = 0.18;

/** `--ease-spring`: EDL's near-critical spring (1.4% overshoot), for a
 * selection pill springing to a new item. Mirrors the CSS `linear()` curve. */
export const SPRING = { type: 'spring', stiffness: 500, damping: 36, mass: 1 } as const;

/**
 * `--duration-fast` / `--duration-base` / `--duration-slow`, in seconds.
 * `enter` (`--duration-enter`) is for staged entrances outside the admin app
 * (sign-in, onboarding, welcome); `count` (`--duration-count`) for a value
 * animating to its target: a number counting up, a bar or meter filling.
 */
export const DURATION = {
  fast: 0.12,
  base: 0.2,
  slow: 0.32,
  enter: 0.4,
  count: 0.6,
} as const;
