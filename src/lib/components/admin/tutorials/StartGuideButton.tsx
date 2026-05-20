'use client';

import { useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';
import { resolveTutorialChain, type ChainResolution } from '@/lib/tutorials/chain';
import { useStartTutorialChain } from '@/lib/tutorials/startTutorialChain';
import { TourWelcome } from './TourWelcome';

interface StartGuideButtonProps {
  /** Tutorial id — its prerequisite chain is resolved against live data on click. */
  tutorialId: string;
  label?: string;
  fullWidth?: boolean;
  /** Centred welcome splash shown before the tour (intro tutorials use this). */
  welcome?: { title: string; body: string };
}

/**
 * Launches a tutorial's interactive guide. On click it resolves the prerequisite
 * chain against live store state (see `resolveTutorialChain`): if anything is
 * missing — or the tutorial has a `welcome` splash — it shows `TourWelcome`
 * listing what we'll prepare first, then runs the chain. With no prerequisites
 * and no welcome, it starts immediately. Must render inside <NextStepProvider>.
 */
export function StartGuideButton({
  tutorialId,
  label = 'Avvia guida interattiva',
  fullWidth = false,
  welcome,
}: StartGuideButtonProps) {
  const runChain = useStartTutorialChain();
  const [open, setOpen] = useState(false);
  const [resolution, setResolution] = useState<ChainResolution | null>(null);

  const launch = () => {
    const res = resolveTutorialChain(tutorialId);
    if (res.missing.length > 0) {
      console.warn(`[tutorials] "${tutorialId}" needs prerequisites with no tutorial yet:`, res.missing);
    }
    const needsPreflight = welcome != null || res.prereqLabels.length > 0 || res.missing.length > 0;
    if (needsPreflight) {
      setResolution(res);
      setOpen(true);
    } else {
      runChain(tutorialId);
    }
  };

  return (
    <>
      <Button variant="primary" leadingIcon={PlayCircle} fullWidth={fullWidth} onClick={launch}>
        {label}
      </Button>
      <TourWelcome
        open={open}
        title={welcome?.title ?? 'Guida interattiva'}
        body={welcome?.body ?? 'Ti guidiamo passo passo. Puoi uscire quando vuoi.'}
        steps={resolution?.prereqLabels}
        missing={resolution?.missing}
        onDismiss={() => setOpen(false)}
        onStart={() => {
          setOpen(false);
          runChain(tutorialId);
        }}
      />
    </>
  );
}
