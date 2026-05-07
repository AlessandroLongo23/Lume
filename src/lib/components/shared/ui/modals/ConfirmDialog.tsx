'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { TriangleAlert, type LucideIcon } from 'lucide-react';
import { Button, type ButtonVariant } from '@/lib/components/shared/ui/Button';

type Tone = 'warning' | 'destructive' | 'default';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  icon?: LucideIcon;
}

const toneClasses: Record<Tone, { tile: string; iconColor: string; confirmVariant: ButtonVariant; confirmExtra?: string }> = {
  warning: {
    tile: 'bg-amber-500/10 ring-1 ring-inset ring-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    confirmVariant: 'primary',
    confirmExtra: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  destructive: {
    tile: 'bg-red-500/10 ring-1 ring-inset ring-red-500/20',
    iconColor: 'text-red-600 dark:text-red-400',
    confirmVariant: 'destructive',
  },
  default: {
    tile: 'bg-primary/10 ring-1 ring-inset ring-primary/20',
    iconColor: 'text-primary',
    confirmVariant: 'primary',
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Conferma',
  cancelLabel = 'Annulla',
  tone = 'warning',
  icon: Icon = TriangleAlert,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose, onConfirm]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!mounted) return null;

  const tones = toneClasses[tone];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-modal-backdrop flex items-center justify-center px-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={description ? 'confirm-description' : undefined}
            className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl ring-1 ring-zinc-500/15 overflow-hidden"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 4, filter: 'blur(2px)' }}
            transition={{ type: 'spring', duration: 0.32, bounce: 0 }}
          >
            <div className="flex flex-col items-start gap-4 px-6 pt-6 pb-5">
              <motion.div
                className={`flex items-center justify-center size-10 rounded-xl ${tones.tile}`}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', duration: 0.5, bounce: 0.35, delay: 0.05 }}
              >
                <Icon className={`size-5 ${tones.iconColor}`} strokeWidth={2} />
              </motion.div>

              <div className="flex flex-col gap-1">
                <h2
                  id="confirm-title"
                  className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
                >
                  {title}
                </h2>
                {description && (
                  <p id="confirm-description" className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 bg-zinc-50/60 dark:bg-zinc-950/40 border-t border-zinc-500/10">
              <Button variant="ghost" size="sm" onClick={onClose}>
                {cancelLabel}
              </Button>
              <Button
                variant={tones.confirmVariant}
                size="sm"
                onClick={onConfirm}
                autoFocus
                className={tones.confirmExtra}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
