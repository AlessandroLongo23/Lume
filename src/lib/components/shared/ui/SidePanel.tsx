'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { DURATION, EASE_OUT } from '@/lib/const/motion';
import { DIALOG_BACKDROP, DialogHeader } from './modals/dialogParts';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** A sheet that slides in from the right, full width on phones. */

export function SidePanel({ isOpen, onClose, title, children }: SidePanelProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 ${DIALOG_BACKDROP} z-modal-backdrop`}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          // The panel is a child of the backdrop, so the backdrop's fade must last
          // as long as the panel's slide or the panel vanishes mid-exit.
          exit={{ opacity: 0, transition: { duration: DURATION.base } }}
          transition={{ duration: DURATION.base }}
        >
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={`fixed top-0 right-0 h-full w-full sm:w-120 bg-[var(--lume-surface-raised)] text-[var(--lume-text)] shadow-float flex flex-col`}
            onClick={(e) => e.stopPropagation()}
            initial={reduceMotion ? { opacity: 0 } : { x: '100%' }}
            animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={{
              ...(reduceMotion ? { opacity: 0 } : { x: '100%' }),
              transition: { duration: DURATION.base, ease: EASE_OUT },
            }}
            transition={{ duration: reduceMotion ? DURATION.fast : DURATION.slow, ease: EASE_OUT }}
          >
            <DialogHeader titleId={titleId} title={title} onClose={onClose} divider />
            <div className="flex-1 overflow-y-auto overscroll-contain p-6">
              {children}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
