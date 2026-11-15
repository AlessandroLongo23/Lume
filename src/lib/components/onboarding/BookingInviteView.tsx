'use client';

import { motion } from 'motion/react';
import { Globe, Calendar, Sparkles, Bell } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';
import { DURATION } from '@/lib/const/motion';
import { EASE_OUT } from './onboardingTypes';
import { OnboardingTitle } from './OnboardingTitle';

const ease = EASE_OUT;

interface BookingInviteViewProps {
  /** Owner clicked "Sì, configura ora" — caller routes to the booking settings page. */
  onAccept: () => void;
  /** Owner clicked "Per ora no" — caller stamps booking_setup_dismissed_at and routes home. */
  onDismiss: () => void;
  /** Disables both buttons during the network call. */
  busy: boolean;
}

const VALUE_BULLETS = [
  {
    icon: Calendar,
    label: 'I clienti prenotano da soli, senza chiamare.',
  },
  {
    icon: Bell,
    label: 'Ti arrivano le richieste sul calendario in tempo reale.',
  },
  {
    icon: Sparkles,
    label: 'Tu decidi orari, servizi, e se approvare a mano.',
  },
] as const;

/**
 * Final step of the onboarding wizard. Offered AFTER the import completes
 * (or is skipped) — the data is in, so we ask whether the owner wants to
 * turn on the public booking page now or later.
 *
 * "Per ora no" stamps `booking_setup_dismissed_at` so the prompt doesn't
 * re-appear on every login. There's no scary commitment — owners can flip
 * the master toggle whenever from /admin/impostazioni/salone/prenotazioni.
 */
export function BookingInviteView({ onAccept, onDismiss, busy }: BookingInviteViewProps) {
  return (
    <div className="w-full max-w-xl px-8 text-center select-none">
      <motion.div
        className="surface-card mx-auto mb-6 flex size-16 items-center justify-center"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: DURATION.enter, ease, delay: 0.05 }}
      >
        <Globe className="size-7 text-[var(--lume-text-secondary)]" strokeWidth={1.75} />
      </motion.div>

      <OnboardingTitle title="Vuoi attivare le prenotazioni online?" delay={0.16}>
        Apri una pagina pubblica a <span className="text-[var(--lume-text)]">lume.app/&lt;nome-salone&gt;</span> dove
        i tuoi clienti possono prenotare 24 ore su 24.
      </OnboardingTitle>

      <motion.ul
        className="mt-8 flex flex-col items-stretch gap-3 text-left"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.enter, ease, delay: 0.4 }}
      >
        {VALUE_BULLETS.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="surface-card flex items-start gap-3 px-4 py-3"
          >
            <Icon className="size-4 mt-0.5 shrink-0 text-[var(--lume-text-muted)]" />
            <span className="text-sm font-light text-[var(--lume-text)]">{label}</span>
          </li>
        ))}
      </motion.ul>

      <motion.div
        className="mt-10 flex flex-row items-center justify-center gap-3"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.enter, ease, delay: 0.54 }}
      >
        <Button variant="primary" onClick={onAccept} disabled={busy}>
          Sì, configura ora
        </Button>
        <Button variant="ghost" onClick={onDismiss} disabled={busy}>
          Per ora no
        </Button>
      </motion.div>

      <motion.p
        className="mt-6 text-xs font-light text-[var(--lume-text-muted)]/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.enter, ease, delay: 0.66 }}
      >
        Puoi attivarle in qualsiasi momento dalle impostazioni.
      </motion.p>
    </div>
  );
}
