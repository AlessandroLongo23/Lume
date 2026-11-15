'use client';

import { useId } from 'react';
import { GraduationCap, ListChecks } from 'lucide-react';
import { Modal } from '@/lib/components/shared/ui/modals/Modal';
import { Button } from '@/lib/components/shared/ui/Button';
import { TextLink } from '@/lib/components/shared/ui/TextLink';

interface TourWelcomeProps {
  open: boolean;
  title: string;
  body: string;
  onStart: () => void;
  onDismiss: () => void;
  /** Prerequisite tutorials that will be run first ("Per questa guida prepariamo prima: …"). */
  steps?: string[];
  /** Prerequisites with no tutorial yet — listed as a muted note (optional link). */
  missing?: { label: string; href?: string }[];
}

/**
 * Centred welcome splash shown before an interactive tour. It lives in its own
 * portal layer and cross-fades: on "Inizia" it fades out while the tour's first
 * (anchored) spotlight + coachmark fade in — avoiding NextStep's centred-card
 * position snap while keeping the welcome perfectly centred.
 */
export function TourWelcome({
  open,
  title,
  body,
  onStart,
  onDismiss,
  steps,
  missing,
}: TourWelcomeProps) {
  const titleId = useId();
  const hasSteps = (steps?.length ?? 0) > 0;
  const hasMissing = (missing?.length ?? 0) > 0;

  return (
    // Modal brings the backdrop, Escape, scroll lock and the shared dialog motion.
    <Modal isOpen={open} onClose={onDismiss} classes="max-w-90" labelledBy={titleId}>
      <div className="p-5">
        <div className="flex items-center gap-3">
          <GraduationCap aria-hidden className="size-5 shrink-0 text-[var(--lume-text-secondary)]" />
          <h2 id={titleId} className="text-base font-medium text-[var(--lume-text)]">{title}</h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[var(--lume-text-secondary)]">{body}</p>

        {hasSteps && (
          <div className="mt-4 surface-card p-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--lume-text)]">
              <ListChecks aria-hidden className="size-3.5 text-[var(--lume-text-secondary)]" />
              Per questa guida prepariamo prima:
            </p>
            <ul className="mt-2 flex flex-col gap-1 pl-5 text-sm text-[var(--lume-text-secondary)]">
              {steps!.map((s) => (
                <li key={s} className="list-disc">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasMissing && (
          <p className="mt-3 text-xs leading-relaxed text-[var(--lume-text-secondary)]">
            Ti servirà anche:{' '}
            {missing!.map((m, i) => (
              <span key={m.label}>
                {i > 0 && ', '}
                {m.href ? (
                  <TextLink href={m.href}>{m.label}</TextLink>
                ) : (
                  m.label
                )}
              </span>
            ))}
            .
          </p>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Più tardi
          </Button>
          <Button variant="primary" size="sm" onClick={onStart}>
            Inizia il giro
          </Button>
        </div>
      </div>
    </Modal>
  );
}
