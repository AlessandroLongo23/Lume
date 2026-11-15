'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { DURATION } from '@/lib/const/motion';
import { EASE_OUT } from './onboardingTypes';

const SIZE = {
  md: { title: 'text-2xl', line: 'mt-2 text-sm' },
  lg: { title: 'text-3xl', line: 'mt-4 text-base leading-relaxed' },
} as const;

/**
 * The centred headline + subline of an onboarding screen, in the wizard's
 * light weight. With `animate` the two rise in one after the other, starting
 * at `delay` seconds; without it the screen's own transition carries them.
 */
export function OnboardingTitle({
  title,
  children,
  size = 'lg',
  animate = true,
  delay = 0,
}: {
  title: ReactNode;
  children?: ReactNode;
  size?: keyof typeof SIZE;
  animate?: boolean;
  delay?: number;
}) {
  const rise = (at: number) =>
    animate
      ? {
          initial: { opacity: 0, y: 6 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: DURATION.enter, ease: EASE_OUT, delay: at },
        }
      : { initial: false as const };

  return (
    <div className="text-center">
      <motion.h1 className={`${SIZE[size].title} font-light tracking-wide text-[var(--lume-text)]`} {...rise(delay)}>
        {title}
      </motion.h1>
      {children && (
        <motion.p className={`${SIZE[size].line} font-light text-[var(--lume-text-muted)]`} {...rise(delay + 0.12)}>
          {children}
        </motion.p>
      )}
    </div>
  );
}
