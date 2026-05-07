'use client';

import { useEffect, useRef } from 'react';
import { animate } from 'motion/react';
import { EASE_OUT } from './onboardingTypes';

interface AnimatedCountProps {
  /** Final value to count up to. */
  value: number;
  /** Seconds to take getting there. */
  duration?: number;
  /** ms before the count-up starts (used to stagger several rows). */
  delay?: number;
}

/**
 * Counts up from 0 to `value` with Italian locale grouping (1.247 not 1,247).
 * The motion is the "wow" of the magic screen — keep the easing matched to
 * the rest of the onboarding flow so it feels like one continuous animation.
 */
export function AnimatedCount({ value, duration = 0.9, delay = 0 }: AnimatedCountProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const controls = animate(0, value, {
      duration,
      delay: delay / 1000,
      ease: EASE_OUT,
      onUpdate: (latest) => {
        node.textContent = Math.round(latest).toLocaleString('it-IT');
      },
    });
    return () => controls.stop();
  }, [value, duration, delay]);

  return <span ref={ref}>0</span>;
}
