'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Maximize2, X } from 'lucide-react';
import { Portal } from '@/lib/components/shared/ui/Portal';

/**
 * Click-to-expand for tutorial screenshots. The inline thumbnail
 * (`<ArticleImage>`) and the near-fullscreen overlay (`<ImageLightbox>`) share a
 * Framer Motion `layoutId` keyed on the image src, so opening morphs the picture
 * from where it sits in the article up to the viewer, and closing morphs it back
 * to the same spot. Both pieces live here so the layoutId and morph timing stay
 * in lockstep.
 *
 * The overlay renders through <Portal> (per AGENTS.md: any Framer blur-in
 * ancestor would otherwise trap its z-index) at the `z-lightbox` tier.
 */

// Mirrors the `--ease-out` token (cubic-bezier(0.22, 1, 0.36, 1)) in JS form, the
// quartic ease-out the design system mandates for motion. No spring: a layout
// animation defaults to one, and DESIGN.md bans bouncy curves.
const MORPH_TRANSITION = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const };

export interface LightboxImage {
  src: string;
  alt: string;
}

/** A tutorial screenshot rendered inline: a button that opens the lightbox. */
export function ArticleImage({
  src,
  alt,
  onOpen,
}: {
  src: string;
  alt: string;
  onOpen: () => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={alt ? `Ingrandisci l’immagine: ${alt}` : 'Ingrandisci l’immagine'}
      className="group relative my-5 block w-full max-w-2xl cursor-zoom-in rounded-xl p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lume-ring-focus)]"
    >
      <motion.img
        layoutId={reduceMotion ? undefined : src}
        transition={MORPH_TRANSITION}
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full rounded-xl border border-[var(--lume-border)] shadow-sm"
      />
      <span className="pointer-events-none absolute right-2 top-2 flex size-8 items-center justify-center rounded-md border border-[var(--lume-border)] bg-[var(--lume-surface-raised)] text-[var(--lume-text-secondary)] opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
        <Maximize2 className="size-4" />
      </span>
    </button>
  );
}

/** The near-fullscreen overlay. Pass `image=null` when closed. */
export function ImageLightbox({
  image,
  onClose,
}: {
  image: LightboxImage | null;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // While open: lock body scroll, close on Escape, move focus to the close
  // button, and return focus to the trigger on close.
  useEffect(() => {
    if (!image) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const raf = requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      cancelAnimationFrame(raf);
      restoreFocusRef.current?.focus?.();
    };
  }, [image, onClose]);

  // The scrim, the picture, and the close button are siblings (not nested),
  // each a direct child of AnimatePresence. The picture must be a direct child
  // for its shared-layout exit to be tracked, otherwise it would morph open but
  // only fade on close. It is centered with `inset-0 m-auto` (auto margins)
  // rather than a translate, which would collide with motion's own layout
  // transform. Clicks land on whichever sibling is under the cursor: the bare
  // margin around the picture is the scrim, so clicking there closes; clicking
  // the picture itself does nothing.
  return (
    <Portal>
      <AnimatePresence>
        {image && [
          <motion.div
            key="scrim"
            aria-hidden="true"
            onClick={onClose}
            className="fixed inset-0 z-lightbox cursor-zoom-out bg-[var(--lume-overlay)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />,
          <motion.img
            key="picture"
            src={image.src}
            alt={image.alt}
            className="fixed inset-0 z-lightbox m-auto h-fit w-fit max-h-[calc(100dvh-3rem)] max-w-[calc(100vw-3rem)] rounded-xl border border-[var(--lume-border)] object-contain shadow-[var(--shadow-xl)]"
            // Reduced motion: a plain fade, no morph. Otherwise the shared
            // layoutId drives the inline-to-fullscreen morph both ways.
            {...(reduceMotion
              ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
              : { layoutId: image.src, transition: MORPH_TRANSITION })}
          />,
          <motion.button
            key="close"
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Chiudi anteprima"
            className="fixed right-3 top-3 z-lightbox flex size-10 items-center justify-center rounded-md border border-[var(--lume-border)] bg-[var(--lume-surface-raised)] text-[var(--lume-text-secondary)] shadow-md transition-colors hover:text-[var(--lume-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lume-ring-focus)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <X className="size-5" />
          </motion.button>,
        ]}
      </AnimatePresence>
    </Portal>
  );
}
