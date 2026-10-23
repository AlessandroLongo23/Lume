'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { DURATION, EASE_OUT } from '@/lib/const/motion';
import { Button } from '@/lib/components/shared/ui/Button';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}

export function SidePanel({ isOpen, onClose, title, children, width = 'w-full sm:w-120' }: SidePanelProps) {
  const [mounted, setMounted] = useState(false);
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
          className="fixed inset-0 bg-black/25 z-modal-backdrop"
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
            aria-label={title}
            className={`fixed top-0 right-0 h-full ${width} bg-white dark:bg-zinc-900 shadow-xl flex flex-col`}
            onClick={(e) => e.stopPropagation()}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%', transition: { duration: DURATION.base, ease: EASE_OUT } }}
            transition={{ duration: DURATION.slow, ease: EASE_OUT }}
          >
            <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-500/25 shrink-0">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
              <Button variant="ghost" size="sm" iconOnly aria-label="Chiudi" onClick={onClose}>
                <X />
              </Button>
            </header>
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
