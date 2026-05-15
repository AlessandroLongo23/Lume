'use client';

import { useEffect, useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';

export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    onChange();
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Ignore — some browsers reject without a recent user gesture.
    }
  };

  return (
    <Button
      variant="secondary"
      size="md"
      iconOnly
      aria-label={isFullscreen ? 'Esci dalla modalità schermo intero' : 'Modalità schermo intero'}
      onClick={toggle}
      data-capture-hide=""
    >
      <span className="relative size-5 flex items-center justify-center">
        <Maximize
          strokeWidth={1.5}
          className={`absolute size-5 transition-all duration-500 text-zinc-950 dark:text-zinc-50 ${
            isFullscreen ? 'rotate-90 scale-0' : 'rotate-0 scale-100'
          }`}
        />
        <Minimize
          strokeWidth={1.5}
          className={`absolute size-5 transition-all duration-500 text-zinc-950 dark:text-zinc-50 ${
            isFullscreen ? 'rotate-0 scale-100' : '-rotate-90 scale-0'
          }`}
        />
      </span>
    </Button>
  );
}
