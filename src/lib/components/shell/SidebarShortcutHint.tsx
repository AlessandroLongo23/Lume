'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { SIDEBAR_HINT_EVENT } from './SidebarCollapseToggle';
import { sidebarToggleLabel } from './keyboardShortcuts';
import { Button } from '@/lib/components/shared/ui/Button';
import { Kbd } from '@/lib/components/shared/ui/Kbd';
import { Portal } from '@/lib/components/shared/ui/Portal';

const AUTO_DISMISS_MS = 6000;

export function SidebarShortcutHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onShow() {
      setVisible(true);
    }
    window.addEventListener(SIDEBAR_HINT_EVENT, onShow);
    return () => window.removeEventListener(SIDEBAR_HINT_EVENT, onShow);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const id = window.setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [visible]);

  // Portaled to <body> so the hint stays above the shell whatever its ancestors do.
  return (
    <Portal>
      {visible && (
        <div
          role="status"
          aria-live="polite"
          className="surface-float fixed bottom-6 left-6 z-tooltip flex items-center gap-2 pl-3.5 pr-1.5 py-1.5 text-sm text-[var(--lume-text-secondary)] max-w-sm animate-in fade-in-0 slide-in-from-bottom-1 duration-[var(--duration-fast)] motion-reduce:animate-none"
        >
          <span>
            Suggerimento: premi{' '}
            <Kbd className="align-middle">{sidebarToggleLabel()}</Kbd>{' '}
            per aprire e chiudere la barra laterale.
          </span>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Chiudi suggerimento"
            onClick={() => setVisible(false)}
          >
            <X />
          </Button>
        </div>
      )}
    </Portal>
  );
}
