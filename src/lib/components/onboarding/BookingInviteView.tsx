'use client';

import { motion } from 'motion/react';
import { Globe, Calendar, Sparkles, Bell } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';
import { EASE_OUT } from './onboardingTypes';

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
        className="mx-auto mb-6 flex size-16 items-center justify-center rounded-md border border-border bg-card"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease, delay: 0.05 }}
      >
        <Globe className="size-7 text-primary" strokeWidth={2} />
      </motion.div>

      <motion.h1
        className="text-3xl font-light tracking-wide text-foreground"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.16 }}
      >
        Vuoi attivare le prenotazioni online?
      </motion.h1>

      <motion.p
        className="mt-4 text-base font-light text-muted-foreground leading-relaxed"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.28 }}
      >
        Apri una pagina pubblica a <span className="text-foreground">lume.app/&lt;nome-salone&gt;</span> dove
        i tuoi clienti possono prenotare 24 ore su 24.
      </motion.p>

      <motion.ul
        className="mt-8 flex flex-col items-stretch gap-3 text-left"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.4 }}
      >
        {VALUE_BULLETS.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-start gap-3 rounded-md border border-border/70 bg-card/60 px-4 py-3"
          >
            <Icon className="size-4 mt-0.5 shrink-0 text-primary" />
            <span className="text-sm font-light text-foreground">{label}</span>
          </li>
        ))}
      </motion.ul>

      <motion.div
        className="mt-10 flex flex-row items-center justify-center gap-3"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.54 }}
      >
        <Button variant="primary" onClick={onAccept} disabled={busy}>
          Sì, configura ora
        </Button>
        <Button variant="ghost" onClick={onDismiss} disabled={busy}>
          Per ora no
        </Button>
      </motion.div>

      <motion.p
        className="mt-6 text-xs font-light text-muted-foreground/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease, delay: 0.66 }}
      >
        Puoi attivarle in qualsiasi momento dalle impostazioni.
      </motion.p>
    </div>
  );
}
