'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';

interface Props {
  isOpen: boolean;
  /** "Annulla" — keep the user on the current page, modifications retained. */
  onCancel: () => void;
  /** "Scarta" — discard buffered changes and proceed with navigation. */
  onDiscard: () => void;
  /** "Salva" — commit buffered changes then proceed with navigation. */
  onSave: () => void;
  saving?: boolean;
  title?: string;
  description?: string;
}

export function UnsavedChangesDialog({
  isOpen,
  onCancel,
  onDiscard,
  onSave,
  saving = false,
  title = 'Modifiche non salvate',
  description = 'Hai modifiche non salvate. Cosa vuoi fare prima di lasciare la pagina?',
}: Props) {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

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
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-modal-backdrop flex items-center justify-center px-4"
          onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="unsaved-title"
            aria-describedby="unsaved-description"
            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl ring-1 ring-zinc-500/15 overflow-hidden"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 4, filter: 'blur(2px)' }}
            transition={{ type: 'spring', duration: 0.32, bounce: 0 }}
          >
            <div className="flex flex-col items-start gap-4 px-6 pt-6 pb-5">
              <motion.div
                className="flex items-center justify-center size-10 rounded-xl bg-amber-500/10 ring-1 ring-inset ring-amber-500/20"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', duration: 0.5, bounce: 0.35, delay: 0.05 }}
              >
                <TriangleAlert className="size-5 text-amber-600 dark:text-amber-400" strokeWidth={2} />
              </motion.div>

              <div className="flex flex-col gap-1">
                <h2
                  id="unsaved-title"
                  className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
                >
                  {title}
                </h2>
                <p id="unsaved-description" className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 px-6 py-4 bg-zinc-50/60 dark:bg-zinc-950/40 border-t border-zinc-500/10">
              <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>
                Scarta
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
                  Annulla
                </Button>
                <Button variant="primary" size="sm" onClick={onSave} loading={saving} autoFocus>
                  {saving ? 'Salvataggio…' : 'Salva'}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
