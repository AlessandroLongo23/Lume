'use client';

import { motion } from 'motion/react';
import { EASE_OUT } from './onboardingTypes';
import { Button } from '@/lib/components/shared/ui/Button';

const ease = EASE_OUT;

const SCOPE_ITEMS = ['Clienti', 'Operatori', 'Servizi', 'Prodotti', 'Appuntamenti'] as const;

interface InvitationViewProps {
  salonName: string;
  onAccept: () => void;
  onSkip: () => void;
  busy: boolean;
}

/**
 * First screen of the onboarding bulk-import wizard. Sells the value
 * proposition in two sentences, names the scope inline via chips, and offers
 * a balanced binary choice with a trust microcopy line below the buttons.
 *
 * Stagger: headline → subline (140 ms) → chips (260 ms) → buttons (400 ms) →
 * trust line (520 ms). Same easing curve as /welcome so the transition feels
 * continuous.
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
        transition={{ duration: 0.5, ease, delay: 0.14 }}
      >
        Posso importarli in <span className="text-foreground">{salonName}</span>. Tutto in una volta.
        <br />
        Excel, CSV, JSON. Qualsiasi cosa va bene.
      </motion.p>

      <motion.ul
        className="mt-6 flex flex-wrap items-center justify-center gap-2"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.26 }}
        aria-label="Cosa viene importato"
      >
        {SCOPE_ITEMS.map((label) => (
          <li
            key={label}
            className="inline-flex items-center rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs font-light text-muted-foreground tracking-wide"
          >
            {label}
          </li>
        ))}
      </motion.ul>

      <motion.div
        className="mt-10 flex flex-row items-center justify-center gap-3"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.4 }}
      >
        <Button variant="primary" onClick={onAccept} disabled={busy}>
          Sì, importa tutto
        </Button>
        <Button variant="ghost" onClick={onSkip} disabled={busy}>
          No, inizio da zero
        </Button>
      </motion.div>

      <motion.p
        className="mt-6 text-xs font-light text-muted-foreground/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease, delay: 0.52 }}
      >
        Niente di esistente viene toccato. Puoi rifare quando vuoi.
      </motion.p>
    </div>
  );
}
