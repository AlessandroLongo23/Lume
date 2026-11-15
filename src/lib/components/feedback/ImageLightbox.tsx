'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { DURATION } from '@/lib/const/motion';

interface ImageLightboxProps {
  urls: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

// The scrim stays black and the controls white in both themes (--lume-scrim,
// --lume-on-scrim): a photo needs a dark surround whatever the app theme.
const ON_SCRIM_BUTTON =
  // ds-ignore: round Button on the black lightbox scrim; its hover fill is white at 20% in both themes, which the ghost variant's theme-based hover cannot give
  'rounded-full bg-[var(--lume-on-scrim)]/10 hover:bg-[var(--lume-on-scrim)]/20 text-[var(--lume-on-scrim)] hover:text-[var(--lume-on-scrim)]';

export function ImageLightbox({ urls, index, onClose, onIndexChange }: ImageLightboxProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && index < urls.length - 1) onIndexChange(index + 1);
      if (e.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [index, urls.length, onClose, onIndexChange]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (urls.length === 0) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const url = urls[index];
  const hasPrev = index > 0;
  const hasNext = index < urls.length - 1;

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-lightbox bg-[var(--lume-scrim)]/90 flex items-center justify-center"
          onClick={handleBackdropClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.fast }}
        >
          <Button
            variant="ghost"
            size="md"
            iconOnly
            aria-label="Chiudi"
            onClick={onClose}
            className={`absolute top-4 right-4 ${ON_SCRIM_BUTTON}`}
          >
            <X />
          </Button>

          {hasPrev && (
            <Button
              variant="ghost"
              size="lg"
              iconOnly
              aria-label="Precedente"
              onClick={(e) => { e.stopPropagation(); onIndexChange(index - 1); }}
              className={`absolute left-4 ${ON_SCRIM_BUTTON}`}
            >
              <ChevronLeft />
            </Button>
          )}
          {hasNext && (
            <Button
              variant="ghost"
              size="lg"
              iconOnly
              aria-label="Successiva"
              onClick={(e) => { e.stopPropagation(); onIndexChange(index + 1); }}
              className={`absolute right-4 ${ON_SCRIM_BUTTON}`}
            >
              <ChevronRight />
            </Button>
          )}

          {urls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[var(--lume-on-scrim)]/10 text-[var(--lume-on-scrim)] text-xs tabular-nums">
              {index + 1} / {urls.length}
            </div>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt=""
            className="max-w-[92vw] max-h-[92vh] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
