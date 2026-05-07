'use client';

import { motion, useReducedMotion } from 'motion/react';

/**
 * Lamplight halo behind the onboarding wizard. A wide indigo radial fall-off
 * centered slightly above the headline area, with a slow ambient pulse to
 * give the screen a sense of being "lit" rather than printed. Pulse is
 * disabled under prefers-reduced-motion; the gradient itself stays.
 */
export function OnboardingHalo() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          'radial-gradient(60% 50% at 50% 38%, var(--lume-accent-light) 0%, transparent 70%)',
        opacity: 0.6,
      }}
      animate={
        reduceMotion
          ? undefined
          : { scale: [0.97, 1.0, 0.97], opacity: [0.5, 0.7, 0.5] }
      }
      transition={{
        duration: 6,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatType: 'mirror',
      }}
    />
  );
}
