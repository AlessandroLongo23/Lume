'use client';

import { useEffect, useRef, useState } from 'react';
import { Bug, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { supabase } from '@/lib/supabase/client';
import { captureViewport } from '@/lib/utils/captureViewport';
import { AddFeedbackModal } from '@/lib/components/feedback/AddFeedbackModal';
import { bugReportLabel } from './keyboardShortcuts';

const BUCKET = 'feedback-attachments';
const FLASH_DURATION_MS = 220;

export function BugButton() {
  const [isWorking, setIsWorking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(false);

  const handleClick = async () => {
    if (isWorking || isModalOpen) return;
    setIsWorking(true);

    let blob: Blob | null = null;
    try {
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
            type="button"
            data-bug-button=""
            data-capture-hide=""
            onClick={handleClick}
            disabled={isWorking}
            aria-label="Segnala un problema"
            className="fixed bottom-6 right-6 z-fab flex items-center justify-center size-11 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors disabled:cursor-not-allowed cursor-pointer"
          >
            {isWorking
              ? <Loader2 className="size-5 animate-spin" strokeWidth={1.5} />
              : <Bug className="size-5" strokeWidth={1.5} />}
          </button>
        </Tooltip>

        <AnimatePresence>
          {showFlash && (
            <motion.div
              key="capture-flash"
              aria-hidden
              initial={{ opacity: 0.65 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: FLASH_DURATION_MS / 1000, ease: 'easeOut' }}
              className="fixed inset-0 z-toast bg-white pointer-events-none"
            />
          )}
        </AnimatePresence>
      </Portal>

      <AddFeedbackModal
        isOpen={isModalOpen}
        onClose={handleClose}
        initialType="bug"
        initialImagePaths={pendingPath ? [pendingPath] : undefined}
      />
    </>
  );
}
