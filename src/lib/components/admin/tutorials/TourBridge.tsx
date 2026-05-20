'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useNextStep } from 'nextstepjs';
import { getTour } from '@/lib/tutorials/tours';
import { onTourEvent } from '@/lib/tutorials/tourEvents';
import { useTourQueueStore } from '@/lib/stores/tourQueue';
import type { LumeTourStep } from '@/lib/tutorials/types';

/**
 * The single place that performs imperative NextStep control under the provider:
 *
 *  1. Advances an `action` step when the user performs its action —
 *     `advanceOnRoute` (navigation) or `completeOn` (a tour event, e.g. a modal save).
 *  2. Drives chained tutorials: the layout's `onComplete`/`onSkip` only record a
 *     finish via `tourQueue.notifyFinished`; here we read that signal and either
 *     start the next tour in the chain, return to the final help page, or (no
 *     active chain) fall back to the finished tour's own `endRoute`.
 *
 * Renders nothing; must live inside `<NextStepProvider>`.
 */
export function TourBridge() {
  const { currentStep, currentTour, isNextStepVisible, setCurrentStep, startNextStep } = useNextStep();
  const pathname = usePathname();
  const router = useRouter();
  const prevPath = useRef(pathname);
  const pendingFinish = useTourQueueStore((s) => s.pendingFinish);

  // (1a) Advance a navigation action step once the app reaches its route.
  useEffect(() => {
    const navigated = prevPath.current !== pathname;
    prevPath.current = pathname;
    if (!navigated || !isNextStepVisible || !currentTour) return;
    const step = getTour(currentTour)?.steps[currentStep] as LumeTourStep | undefined;
    if (!step || step.mode !== 'action' || !step.advanceOnRoute) return;
    if (pathname === step.advanceOnRoute) setCurrentStep(currentStep + 1);
  }, [pathname, currentStep, currentTour, isNextStepVisible, setCurrentStep]);

  // (1b) Advance a modal/action step when its `completeOn` tour event fires.
  useEffect(() => {
    if (!isNextStepVisible || !currentTour) return;
    const step = getTour(currentTour)?.steps[currentStep] as LumeTourStep | undefined;
    if (!step || step.mode !== 'action' || !step.completeOn) return;
    return onTourEvent(step.completeOn, () => setCurrentStep(currentStep + 1));
  }, [currentStep, currentTour, isNextStepVisible, setCurrentStep]);

  // (1c) Make the spotlight + card FOLLOW the highlighted element. NextStep only
  // re-measures on window 'resize' and a ResizeObserver on the target — so it
  // misses transform/entrance animations, scrolling, and position shifts caused
  // by surrounding reflow (a sibling growing moves the target without changing
  // its own size). We poll the active step's target each frame and, only when its
  // rect actually changes, dispatch 'resize' (the one external lever NextStep
  // exposes) so it repositions. Static steps dispatch nothing — no resize storm.
  useEffect(() => {
    if (!isNextStepVisible || !currentTour) return;
    const step = getTour(currentTour)?.steps[currentStep] as LumeTourStep | undefined;
    const selector = step?.selector;
    if (!selector) return;

    let raf = 0;
    let last = '';
    const tick = () => {
      const el = document.querySelector(selector);
      if (el) {
        const r = el.getBoundingClientRect();
        const key = `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}`;
        if (key !== last) {
          last = key;
          window.dispatchEvent(new Event('resize'));
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [currentStep, currentTour, isNextStepVisible]);

  // (2) Handle a finished tour: drive the chain, or fall back to its endRoute.
  useEffect(() => {
    if (!pendingFinish) return;
    const { active, finalEndRoute, advance, abort, consumeFinish } = useTourQueueStore.getState();

    if (active) {
      if (pendingFinish.type === 'complete') {
        const next = advance();
        if (next) {
          const tour = getTour(next);
          if (tour?.startRoute) router.push(tour.startRoute);
          startNextStep(next);
        } else if (finalEndRoute) {
          router.push(finalEndRoute);
        }
      } else {
        // User skipped a prerequisite tour — abandon the chain, return to the
        // original tutorial's help page.
        abort();
        if (finalEndRoute) router.push(finalEndRoute);
      }
    } else {
      const route = getTour(pendingFinish.tourName)?.endRoute;
      if (route) router.push(route);
    }

    consumeFinish();
  }, [pendingFinish, router, startNextStep]);

  return null;
}
