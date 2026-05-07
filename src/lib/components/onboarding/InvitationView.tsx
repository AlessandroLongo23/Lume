'use client';

import { motion } from 'motion/react';
import { EASE_OUT } from './onboardingTypes';
import { Button } from '@/lib/components/shared/ui/Button';

const ease = EASE_OUT;

interface InvitationViewProps {
  salonName: string;
  onAccept: () => void;
  onSkip: () => void;
  busy: boolean;
}

/**
 * First screen of the onboarding bulk-import wizard. Sells the value
 * proposition in two sentences and offers a clean binary choice.
 *
 * Stagger: headline → subline (200 ms) → buttons (400 ms). Same easing curve
 * as /welcome so the transition feels continuous.
 */
export function InvitationView({ salonName, onAccept, onSkip, busy }: InvitationViewProps) {
  return (
    <div className="w-full max-w-xl px-8 text-center select-none">
      <motion.h1
        className="text-3xl font-light tracking-wide text-foreground"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        Hai dei dati nel tuo vecchio gestionale?
      </motion.h1>

      <motion.p
        className="mt-4 text-base font-light text-muted-foreground leading-relaxed"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.2 }}
      >
        Posso importarli in <span className="text-foreground">{salonName}</span>. Tutto in una volta.
        <br />
        Excel, CSV, JSON. Qualsiasi cosa va bene.
      </motion.p>

      <motion.div
        className="mt-10 flex flex-col items-center gap-4"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.4 }}
      >
        <Button variant="primary" onClick={onAccept} disabled={busy}>
          Sì, importa tutto
        </Button>
        <button
          type="button"
          onClick={onSkip}
          disabled={busy}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors font-light"
        >
          No, inizio da zero
        </button>
      </motion.div>
    </div>
  );
}
