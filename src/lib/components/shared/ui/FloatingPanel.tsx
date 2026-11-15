'use client';

import { forwardRef } from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { DURATION, EASE_OUT } from '@/lib/const/motion';
import { cn } from '@/lib/utils';

interface FloatingPanelProps extends HTMLMotionProps<'div'> {
  /** Which side of the trigger it opens on; the panel drifts in from there. */
  side?: 'top' | 'bottom';
  /** z-index tier (AGENTS.md). Popovers and pickers: popover; menus: dropdown. */
  layer?: 'dropdown' | 'popover';
}

/**
 * The surface of everything that floats over the page: menus, select lists,
 * pickers, autocompletes, popovers. One look (raised fill, shadow-float, no
 * border) and one enter/exit motion (fade + 4px drift, reduced motion fades
 * only). Positioning stays with the caller; render it through <Portal> and
 * inside <AnimatePresence> for the exit.
 */
export const FloatingPanel = forwardRef<HTMLDivElement, FloatingPanelProps>(function FloatingPanel(
  { side = 'bottom', layer = 'popover', className, children, ...rest },
  ref,
) {
  const reduceMotion = useReducedMotion();
  const offset = side === 'bottom' ? -4 : 4;
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, y: offset };
  return (
    <motion.div
      ref={ref}
      initial={hidden}
      animate={{ opacity: 1, y: 0 }}
      exit={{ ...hidden, transition: { duration: DURATION.fast, ease: EASE_OUT } }}
      transition={{ duration: DURATION.base, ease: EASE_OUT }}
      className={cn('surface-float overflow-hidden', layer === 'dropdown' ? 'z-dropdown' : 'z-popover', className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
});
