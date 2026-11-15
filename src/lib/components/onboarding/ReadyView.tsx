'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SplitText } from '@/lib/components/shared/ui/SplitText';
import { EASE_OUT } from '@/lib/const/motion';

const FADE_DURATION = 0.5;
const DISPLAY_DURATION = 2400;

interface ReadyViewProps {
  /** Fired once the splash has played and faded out — navigate to the app here. */
  onComplete: () => void;
}

/**
 * Onboarding finale. Reuses the post-registration /welcome splash treatment,
 * but as the *true* "all set" moment: it only renders after every setup step
 * (data import + booking decision) is behind the user. The welcome splash no
 * longer claims completion — this view does. Holds the message for one beat,
 * fades out, then hands control back via onComplete (the calendar redirect).
 *
 * It renders under the (onboarding) layout, so it keeps the same halo + logo
 * as the rest of the wizard — no jarring background flip on the way out.
 */
export function ReadyView({ onComplete }: ReadyViewProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(
      () => setVisible(false),
      FADE_DURATION * 1000 + DISPLAY_DURATION,
    );
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          key="ready"
          className="px-8 select-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: FADE_DURATION, ease: EASE_OUT }}
        >
          <SplitText
            className="text-2xl font-light tracking-wide text-[var(--lume-text)]"
          >
            Tutto pronto. Iniziamo.
          </SplitText>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
