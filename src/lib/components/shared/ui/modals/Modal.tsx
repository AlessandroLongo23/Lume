'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { DURATION } from '@/lib/const/motion';
import { DIALOG_BACKDROP, DIALOG_SURFACE, backdropMotion, dialogMotion } from './dialogParts';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Width of the dialog card (`max-w-*`). */
  classes?: string;
  closeOnOutsideClick?: boolean;
  /** Fired once the open animation finishes (not on close). Callers that position
   *  UI against the modal's final rect, e.g. an interactive-guide coachmark
   *  anchored on a field inside it, should wait for this, otherwise they measure
   *  the element mid-entrance and land in the wrong place. */
  onEnterComplete?: () => void;
  /** Id of the visible title (DialogHeader's titleId) that names the dialog. */
  labelledBy?: string;
  /** Id of the text that describes the dialog. */
  describedBy?: string;
  /** `alertdialog` for confirmations that interrupt a flow. */
  role?: 'dialog' | 'alertdialog';
}

/**
 * The one dialog shell: portal, backdrop, Escape, scroll lock, enter/exit
 * motion and the dialog card itself (`DIALOG_SURFACE`, a flex column capped
 * at 92% of the viewport height, with a 16px gutter on phones). Children are
 * the header, body and footer (see dialogParts).
 */
export function Modal({
  isOpen,
  onClose,
  children,
  classes = '',
  closeOnOutsideClick = true,
  onEnterComplete,
  labelledBy,
  describedBy,
  role = 'dialog',
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();
  const panelMotion = dialogMotion(reduceMotion);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 ${DIALOG_BACKDROP} z-modal-backdrop`}
          onClick={handleBackdropClick}
          {...backdropMotion}
          // The panel is a child of the backdrop, so the backdrop's fade dims it
          // too: the backdrop's exit must not be shorter than the panel's
          // (both DURATION.fast) or the panel vanishes before it finishes fading.
          exit={{ opacity: 0, transition: { duration: DURATION.fast } }}
        >
          <motion.div
            role={role}
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            className={cn(
              'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-h-[92dvh] flex flex-col',
              DIALOG_SURFACE,
              classes,
            )}
            onClick={(e) => e.stopPropagation()}
            {...panelMotion}
            // Only the open animation settles to y:0 while open; the exit
            // runs with isOpen already false, so this guard fires once, on enter.
            onAnimationComplete={() => { if (isOpen) onEnterComplete?.(); }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
