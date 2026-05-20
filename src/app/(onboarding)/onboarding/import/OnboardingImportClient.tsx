'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'motion/react';
import { InvitationView } from '@/lib/components/onboarding/InvitationView';
import { DropView } from '@/lib/components/onboarding/DropView';
import { MagicView } from '@/lib/components/onboarding/MagicView';
import { DoneView } from '@/lib/components/onboarding/DoneView';
import { BookingInviteView } from '@/lib/components/onboarding/BookingInviteView';
import { ReadyView } from '@/lib/components/onboarding/ReadyView';
import { useOnboardingUpload } from '@/lib/components/onboarding/useOnboardingUpload';
import {
  TERMINAL_STATUSES,
  type OnboardingState,
  type ChildState,
} from '@/lib/components/onboarding/onboardingTypes';

type ManualStep = 'invitation' | 'drop';

interface Props {
  salonName: string;
  existingOnboardingId: string | null;
  /** True when the owner has already enabled the public booking app or
   *  explicitly dismissed the onboarding prompt — we skip the new step then. */
  bookingDecided: boolean;
}

const POLL_INTERVAL_MS = 1500;

/**
 * Top-level state machine for the onboarding bulk-import wizard.
 *
 * Step is derived: while the user hasn't started anything we render either
 * the InvitationView or DropView based on `manualStep`. Once an onboarding
 * row exists we render MagicView (mid-flight) or DoneView (terminal). This
 * avoids the setState-in-effect pattern eslint flags as a perf footgun.
 */
export default function OnboardingImportClient({
  salonName,
  existingOnboardingId,
  bookingDecided,
}: Props) {
  const router = useRouter();
  const [manualStep, setManualStep] = useState<ManualStep>('invitation');
  const [files, setFiles] = useState<File[]>([]);
  const [onboardingId, setOnboardingId] = useState<string | null>(existingOnboardingId);
  const [state, setState] = useState<OnboardingState | null>(null);
  const [jobs, setJobs] = useState<ChildState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [skipBusy, setSkipBusy] = useState(false);
  const [openBusy, setOpenBusy] = useState(false);
  const [continueBusy, setContinueBusy] = useState(false);

  // 'booking-invite' is the post-import step (sub-project J). It overrides
  // the derived step so the calendar redirect waits until the visitor has
  // answered the prompt. Setting it from a button handler — not from an
  // effect — keeps the render path predictable.
  const [showBookingInvite, setShowBookingInvite] = useState(false);
  const [bookingBusy, setBookingBusy] = useState(false);

  // 'ready' is the onboarding finale (the "Tutto pronto" splash). It supersedes
  // every other step and only fires once setup is fully behind the user — the
  // ReadyView plays the splash, then its onComplete performs the calendar
  // redirect. Reached from the two paths that finish onboarding into the app.
  const [showReady, setShowReady] = useState(false);

  const upload = useOnboardingUpload();

  // Resume any in-flight onboarding once on mount.
  const didResumeRef = useRef(false);
  useEffect(() => {
    if (!existingOnboardingId || didResumeRef.current) return;
    didResumeRef.current = true;
    fetch(`/api/onboarding/imports/${existingOnboardingId}/resume`, { method: 'POST' }).catch(
      (err) => console.warn('[onboarding] resume failed', err),
    );
  }, [existingOnboardingId]);

  const refresh = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/onboarding/imports/${id}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) return;
      setState(json.onboarding as OnboardingState);
      setJobs((json.children ?? []) as ChildState[]);
    } catch (err) {
      console.warn('[onboarding] refresh failed', err);
    }
  }, []);

  // Poll while we have an active onboarding row. The immediate refresh is
  // deferred to a microtask so the synchronous setState inside it doesn't
  // run during the effect body (lint rule react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!onboardingId) return;
    let cancelled = false;
    const kickoff = setTimeout(() => {
      if (!cancelled) refresh(onboardingId);
    }, 0);
    const interval = setInterval(() => {
      if (cancelled) return;
      refresh(onboardingId);
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(kickoff);
      clearInterval(interval);
    };
  }, [onboardingId, refresh]);

  async function handleAccept() {
    setManualStep('drop');
  }

  // Either go to the booking invite step or jump straight to the calendar
  // when the owner has already settled the booking decision before this
  // session (we don't want to nag).
  function exitToHomeOrInvite() {
    if (bookingDecided) {
      setShowReady(true);
    } else {
      setShowBookingInvite(true);
    }
  }

  async function handleSkip() {
    setSkipBusy(true);
    setError(null);
    try {
      let id = onboardingId;
      if (!id) {
        // Lazy-create a row so /skip has something to mark.
        const initRes = await fetch('/api/onboarding/imports/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: [{ filename: '_skipped.txt', sizeBytes: 1 }] }),
        });
        const initJson = await initRes.json();
        if (initJson.onboardingId) id = initJson.onboardingId;
      }
      if (id) {
        await fetch(`/api/onboarding/imports/${id}/skip`, { method: 'POST' });
      }
      exitToHomeOrInvite();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSkipBusy(false);
    }
  }

  async function handleSubmit() {
    if (files.length === 0) return;
    const result = await upload.start(files);
    if (result?.onboardingId) {
      setOnboardingId(result.onboardingId);
    }
  }

  async function handleOpenCalendar() {
    setOpenBusy(true);
    try {
      if (onboardingId) {
        await fetch(`/api/onboarding/imports/${onboardingId}/finalize`, { method: 'POST' });
      }
      exitToHomeOrInvite();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setOpenBusy(false);
    }
  }

  async function handleContinueInBackground() {
    if (!onboardingId) return;
    setContinueBusy(true);
    try {
      await fetch(`/api/onboarding/imports/${onboardingId}/finalize`, { method: 'POST' });
      exitToHomeOrInvite();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setContinueBusy(false);
    }
  }

  async function handleCancelImport() {
    if (!onboardingId) return;
    setSkipBusy(true);
    setError(null);
    try {
      await fetch(`/api/onboarding/imports/${onboardingId}/skip`, { method: 'POST' });
      exitToHomeOrInvite();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSkipBusy(false);
    }
  }

  // "Sì, configura ora" — finalize the import (no-op if already done) and
  // jump straight to the booking-config settings page.
  function handleAcceptBooking() {
    setBookingBusy(true);
    router.push('/admin/impostazioni/salone/prenotazioni');
  }

  // "Per ora no" — stamp booking_setup_dismissed_at so this prompt doesn't
  // re-appear and route to the calendar. PATCH failure is non-fatal here:
  // the user has clearly opted out, so worst case we re-prompt next login.
  async function handleDismissBooking() {
    setBookingBusy(true);
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_setup_dismissed_at: new Date().toISOString() }),
      });
    } catch (err) {
      console.warn('[onboarding] dismiss booking failed', err);
    }
    setShowReady(true);
  }

  function handleReviewPending(jobId: string) {
    router.push(`/admin/imports/${jobId}`);
  }

  // Derive the rendered step from current state. The booking-invite step,
  // when active, supersedes everything else — once the visitor has reached
  // it, going "back" doesn't make sense (the import is already finalized).
  const isTerminal = state ? TERMINAL_STATUSES.has(state.status) : false;
  const renderedStep:
    | 'invitation'
    | 'drop'
    | 'magic'
    | 'done'
    | 'booking-invite'
    | 'ready' = showReady
    ? 'ready'
    : showBookingInvite
    ? 'booking-invite'
    : onboardingId
    ? isTerminal
      ? 'done'
      : 'magic'
    : manualStep;

  return (
    <AnimatePresence mode="wait">
      {renderedStep === 'invitation' && (
        <InvitationView
          key="invitation"
          salonName={salonName}
          onAccept={handleAccept}
          onSkip={handleSkip}
          busy={skipBusy}
        />
      )}
      {renderedStep === 'drop' && (
        <DropView
          key="drop"
          files={files}
          onChange={setFiles}
          onSubmit={handleSubmit}
          onBack={() => setManualStep('invitation')}
          uploads={upload.uploads}
          busy={upload.busy}
          error={upload.error ?? error}
        />
      )}
      {renderedStep === 'magic' && state && (
        <MagicView
          key="magic"
          state={state}
          jobs={jobs}
          onCancel={handleCancelImport}
          onContinueInBackground={handleContinueInBackground}
          busyContinue={continueBusy}
          busyCancel={skipBusy}
        />
      )}
      {renderedStep === 'magic' && !state && (
        <div key="magic-loading" className="text-sm text-muted-foreground">
          Sto avviando…
        </div>
      )}
      {renderedStep === 'done' && state && (
        <DoneView
          key="done"
          state={state}
          jobs={jobs}
          onOpenCalendar={handleOpenCalendar}
          onReviewPending={handleReviewPending}
          busy={openBusy}
        />
      )}
      {renderedStep === 'booking-invite' && (
        <BookingInviteView
          key="booking-invite"
          onAccept={handleAcceptBooking}
          onDismiss={handleDismissBooking}
          busy={bookingBusy}
        />
      )}
      {renderedStep === 'ready' && (
        <ReadyView key="ready" onComplete={() => router.push('/admin/calendario')} />
      )}
    </AnimatePresence>
  );
}
