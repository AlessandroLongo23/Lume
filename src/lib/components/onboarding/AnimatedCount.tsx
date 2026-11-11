'use client';

import { useEffect, useRef } from 'react';
import { animate } from 'motion/react';
import { DURATION } from '@/lib/const/motion';
import { EASE_OUT } from './onboardingTypes';

interface AnimatedCountProps {
  /** Final value to count up to. */
  value: number;
}

/**
 * Counts up from 0 to `value` with Italian locale grouping (1.247 not 1,247).
 * The motion is the "wow" of the magic screen — keep the easing matched to
 * the rest of the onboarding flow so it feels like one continuous animation.
 */
export function AnimatedCount({ value }: AnimatedCountProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const controls = animate(0, value, {
      duration: DURATION.count,
      ease: EASE_OUT,
      onUpdate: (latest) => {
        node.textContent = Math.round(latest).toLocaleString('it-IT');
      },
    });
    return () => controls.stop();
  }, [value]);

  return <span ref={ref}>0</span>;
}
