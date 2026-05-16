'use client';

import { motion, useReducedMotion } from 'motion/react';

/**
 * Lamplight halo behind the onboarding wizard. Two stacked indigo gradients —
 * a wide ambient wash + a tighter inner glow — give the screen a "lit from
 * within" depth rather than a single flat radial. The slow pulse on the outer
 * layer is disabled under prefers-reduced-motion; the gradients themselves stay.
 */
export function OnboardingHalo() {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* Outer ambient wash — pulses softly */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(70% 55% at 50% 40%, var(--lume-accent-light) 0%, transparent 70%)',
          opacity: 0.95,
        }}
        animate={
          reduceMotion
            ? undefined
            : { scale: [0.98, 1.02, 0.98], opacity: [0.85, 1, 0.85] }
        }
        transition={{
          duration: 7,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'mirror',
        }}
      />
      {/* Inner tighter glow — adds the sense of a light source */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(28% 22% at 50% 42%, var(--lume-accent-light) 0%, transparent 80%)',
          opacity: 0.7,
          mixBlendMode: 'multiply',
        }}
      />
    </div>
  );
}
