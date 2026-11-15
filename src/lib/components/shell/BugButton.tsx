'use client';

// ds-ignore: stays local, the bug-report floating action button with its screenshot flow; its corner button has a look Button lacks (see below)
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Bug, Loader2 } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { supabase } from '@/lib/supabase/client';
import { bugReportLabel } from './keyboardShortcuts';

// The button sits on every admin page; the feedback modal (with its rich-text
// editor, about 95KB) and the screenshot library load on the first click.
const loadFeedbackModal = () =>
  import('@/lib/components/feedback/AddFeedbackModal').then((m) => m.AddFeedbackModal);
const AddFeedbackModal = dynamic(loadFeedbackModal, { ssr: false });

const BUCKET = 'feedback-attachments';
const FLASH_DURATION_MS = 220;

export function BugButton() {
  const [isWorking, setIsWorking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Mounted on the first open and kept, so the modal can play its exit.
  const [modalMounted, setModalMounted] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const reduceMotion = useReducedMotion();

  const handleClick = async () => {
    if (isWorking || isModalOpen) return;
    setIsWorking(true);
    // Fetch the modal's code while the screenshot is taken and uploaded.
    void loadFeedbackModal();

    let blob: Blob | null = null;
    try {
      const { captureViewport } = await import('@/lib/utils/captureViewport');
      blob = await captureViewport();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error('Impossibile catturare lo screenshot: ' + msg);
    }

    let uploadedPath: string | null = null;
    if (blob) {
      setShowFlash(true);
      window.setTimeout(() => setShowFlash(false), FLASH_DURATION_MS);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Non autenticato');
        const path = `feedback/${user.id}/${crypto.randomUUID()}.webp`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, blob, { contentType: 'image/webp' });
        if (error) throw new Error(error.message);
        uploadedPath = path;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
        messagePopup.getState().error('Caricamento screenshot fallito: ' + msg);
      }
    }

    setPendingPath(uploadedPath);
    setIsWorking(false);
    setModalMounted(true);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setPendingPath(null);
  };

  // Keep the keydown listener stable while still calling the latest handler.
  const handleClickRef = useRef(handleClick);
  handleClickRef.current = handleClick;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || !e.shiftKey) return;
      if (e.key.toLowerCase() !== 'b') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      handleClickRef.current();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <Portal>
        <Tooltip label="Segnala un problema" shortcut={bugReportLabel()} side="left">
          <button
            // ds-ignore: floating action button pinned to the corner (float surface, 44px, rounded-xl, its own hover tint); Button has no floating variant
            type="button"
            data-bug-button=""
            data-capture-hide=""
            onClick={handleClick}
            disabled={isWorking}
            aria-label="Segnala un problema"
            // ds-ignore: the floating action button's own hover, not a row in a list
            className="surface-float fixed bottom-6 right-6 z-fab flex items-center justify-center size-11 rounded-xl text-[var(--lume-text-secondary)] hover:text-[var(--lume-text)] hover:bg-[color-mix(in_oklab,var(--lume-text)_4%,var(--lume-surface-raised))] active:scale-[0.97] motion-reduce:active:scale-100 transition-[background-color,color,scale] duration-[var(--duration-fast)] ease-[var(--ease-out)] disabled:cursor-not-allowed cursor-pointer"
          >
            {isWorking
              ? <Loader2 className="size-5 animate-spin" strokeWidth={1.5} />
              : <Bug className="size-5" strokeWidth={1.5} />}
          </button>
        </Tooltip>

        <AnimatePresence>
          {showFlash && !reduceMotion && (
            <motion.div
              key="capture-flash"
              aria-hidden
              initial={{ opacity: 0.65 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: FLASH_DURATION_MS / 1000, ease: 'easeOut' }}
              className="fixed inset-0 z-toast bg-[var(--lume-text-on-accent)] pointer-events-none"
            />
          )}
        </AnimatePresence>
      </Portal>

      {modalMounted && (
        <AddFeedbackModal
          isOpen={isModalOpen}
          onClose={handleClose}
          initialType="bug"
          initialImagePaths={pendingPath ? [pendingPath] : undefined}
        />
      )}
    </>
  );
}
