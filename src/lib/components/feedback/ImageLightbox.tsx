'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageLightboxProps {
  urls: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

export function ImageLightbox({ urls, index, onClose, onIndexChange }: ImageLightboxProps) {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

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

  if (!mounted || urls.length === 0) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const url = urls[index];
  const hasPrev = index > 0;
  const hasNext = index < urls.length - 1;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
        onClick={handleBackdropClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <button
          type="button"
          aria-label="Chiudi"
          onClick={onClose}
          className="absolute top-4 right-4 size-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        >
          <X className="size-6" />
        </button>

        {hasPrev && (
          <button
            type="button"
            aria-label="Precedente"
            onClick={(e) => { e.stopPropagation(); onIndexChange(index - 1); }}
            className="absolute left-4 size-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="size-7" />
          </button>
        )}
        {hasNext && (
          <button
            type="button"
            aria-label="Successiva"
            onClick={(e) => { e.stopPropagation(); onIndexChange(index + 1); }}
            className="absolute right-4 size-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <ChevronRight className="size-7" />
          </button>
        )}

        {urls.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white text-xs tabular-nums">
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
    </AnimatePresence>,
    document.body,
  );
}
