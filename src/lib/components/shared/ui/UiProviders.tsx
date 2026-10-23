'use client';

import { type ReactNode } from 'react';
import { MotionConfig } from 'motion/react';
import { Tooltip } from '@base-ui/react/tooltip';

/**
 * App-wide interaction settings, mounted once at the root.
 *
 * - Every `motion` animation follows the OS reduced-motion setting: transforms
 *   and layout animations are skipped, opacity fades are kept.
 * - Tooltips form one delay group: after one has shown, its neighbours open
 *   without waiting (moving along the collapsed sidebar, a toolbar row).
 */
export function UiProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <Tooltip.Provider delay={300} timeout={400}>
        {children}
      </Tooltip.Provider>
    </MotionConfig>
  );
}
