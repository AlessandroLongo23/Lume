'use client';

import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { messagePopup } from './messagePopup';
import { DURATION, EASE_OUT } from '@/lib/const/motion';
import { Button } from '@/lib/components/shared/ui/Button';

export function MessagePopupContainer() {
  const messages = messagePopup((s) => s.messages);
  const dismiss = messagePopup((s) => s.dismiss);

  const icons = {
    success: <CheckCircle className="size-4.5 text-emerald-500 shrink-0" />,
    error: <XCircle className="size-4.5 text-red-500 shrink-0" />,
    info: <Info className="size-4.5 text-primary shrink-0" />,
  };

  // The region stays mounted so screen readers announce each new message, and
  // so a dismissed toast can play its exit before it leaves the DOM.
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 right-4 z-toast flex flex-col gap-2 w-72 pointer-events-none"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            layout
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: DURATION.fast, ease: EASE_OUT } }}
            transition={{ duration: DURATION.base, ease: EASE_OUT }}
            className="pointer-events-auto flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 shadow-lg shadow-black/6"
          >
            {icons[msg.type]}
            <div className="flex-1 min-w-0">
              {msg.title && (
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{msg.title}</p>
              )}
              <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{msg.message}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label="Chiudi"
              onClick={() => dismiss(msg.id)}
              className="shrink-0"
            >
              <X />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
