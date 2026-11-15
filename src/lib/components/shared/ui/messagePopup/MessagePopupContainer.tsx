'use client';

import { CircleCheck, CircleX, Info, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { messagePopup } from './messagePopup';
import { DURATION, EASE_OUT } from '@/lib/const/motion';
import { Button } from '@/lib/components/shared/ui/Button';
import { Portal } from '@/lib/components/shared/ui/Portal';

export function MessagePopupContainer() {
  const messages = messagePopup((s) => s.messages);
  const dismiss = messagePopup((s) => s.dismiss);
  const reduceMotion = useReducedMotion();

  const icons = {
    success: <CircleCheck className="size-4 text-success-strong shrink-0" aria-hidden />,
    error: <CircleX className="size-4 text-danger-strong shrink-0" aria-hidden />,
    info: <Info className="size-4 text-info-strong shrink-0" aria-hidden />,
  };

  // Raised chip with a soft status tint over the surface, so the type reads at
  // a glance; text stays neutral.
  const tints = {
    success: 'bg-[color-mix(in_oklab,var(--lume-success-bg)_70%,var(--lume-surface-raised))]',
    error: 'bg-[color-mix(in_oklab,var(--lume-danger-bg)_70%,var(--lume-surface-raised))]',
    info: 'bg-[var(--lume-surface-raised)]',
  };

  // The region stays mounted so screen readers announce each new message, and
  // so a dismissed toast can play its exit before it leaves the DOM. Portaled
  // to <body> so no ancestor's stacking context can cover it.
  return (
    <Portal>
      <div
        role="status"
        aria-live="polite"
        className="fixed top-4 inset-x-4 sm:left-auto sm:right-4 sm:w-80 z-toast flex flex-col items-stretch gap-2 pointer-events-none"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              layout={!reduceMotion}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: DURATION.fast, ease: EASE_OUT } }}
              transition={{ duration: DURATION.base, ease: EASE_OUT }}
              className={`pointer-events-auto flex items-center gap-2.5 pl-3 pr-1 py-1 min-h-11 rounded-lg shadow-float ${tints[msg.type]}`}
            >
              {icons[msg.type]}
              <div className="flex-1 min-w-0">
                {msg.title && (
                  <p className="text-sm font-medium text-[var(--lume-text)] truncate">{msg.title}</p>
                )}
                <p className={`text-sm truncate ${msg.title ? 'text-[var(--lume-text-secondary)]' : 'text-[var(--lume-text)]'}`}>
                  {msg.message}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                aria-label="Chiudi"
                onClick={() => dismiss(msg.id)}
              >
                <X />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Portal>
  );
}
