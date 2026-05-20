'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNextStep } from 'nextstepjs';
import { getTutorialById } from './registry';
import { getTour } from './tours';
import { useTourQueueStore } from '@/lib/stores/tourQueue';

/**
 * Begins a tutorial chain: resolves the target's unmet prerequisites, primes the
 * tour queue, navigates to the first tour's start route, and starts it. Must be
 * called from a component under `<NextStepProvider>` (it uses `useNextStep`).
 *
 * The caller (StartGuideButton) resolves the chain separately via
 * `resolveTutorialChain` to render the preflight; this hook only runs it.
 */
export function useStartTutorialChain(): (targetId: string) => void {
  const router = useRouter();
  const { startNextStep } = useNextStep();
  const start = useTourQueueStore((s) => s.start);

  return useCallback(
    (targetId: string) => {
      const target = getTutorialById(targetId);
      const finalEndRoute = target ? `/admin/aiuto/${target.slug}` : null;
      const firstTourId = start(targetId, finalEndRoute);
      if (!firstTourId) return;
      const tour = getTour(firstTourId);
      if (tour?.startRoute) router.push(tour.startRoute);
      startNextStep(firstTourId);
    },
    [router, startNextStep, start],
  );
}
