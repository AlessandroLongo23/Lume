'use client';

import { useRef, useState } from 'react';
import { Sparkles, X, Upload, Paperclip, FileX, Send, Plus } from 'lucide-react';
import { Modal } from '@/lib/components/shared/ui/modals/Modal';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface ConciergeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConciergeImportModal({ isOpen, onClose }: ConciergeImportModalProps) {
  const [files, setFiles] = useState<{ fileBase64: string; fileName: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setFiles([]);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    const oversized = selected.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      messagePopup.getState().error(`${oversized.map((f) => f.name).join(', ')}: supera il limite di 10 MB.`);
    }

    const valid = selected.filter((f) => f.size <= MAX_FILE_SIZE);
    e.target.value = '';

    valid.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip the data URI prefix — Resend expects raw base64
        const raw = result.split(',')[1];
        setFiles((prev) => {
          // Avoid exact duplicates (same name + size)
          if (prev.some((f) => f.fileName === file.name)) return prev;
          return [...prev, { fileBase64: raw, fileName: file.name }];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.fileName !== name));
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
      });

      if (!res.ok) throw new Error('request failed');

      messagePopup.getState().success('File ricevuto! Il nostro team importerà i tuoi dati nelle prossime 24 ore.');
      handleClose();
    } catch {
      messagePopup.getState().error('Errore durante l\'invio. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} classes="max-w-lg" closeOnOutsideClick>
      <div className="flex flex-col bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-xl w-full">

        {/* Header */}
        <div className="flex flex-row items-center justify-between p-6 border-b border-zinc-500/25">
          <div className="flex flex-row items-center gap-3 min-w-0">
            <div className="flex shrink-0 items-center justify-center size-10 rounded-lg bg-primary/10">
              <Sparkles className="size-5 text-primary" />
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Migrazione Gratuita</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Inclusa nel tuo abbonamento</p>
            </div>
          </div>
          <button
            className="shrink-0 ml-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            onClick={handleClose}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Non perdere tempo a ricopiare i dati a mano. Carica il PDF o l&apos;Excel del tuo vecchio gestionale
            e il nostro team si occuperà di importare tutto{' '}
            <strong className="text-zinc-900 dark:text-zinc-100">in meno di 24 ore</strong>.
          </p>

          {/* File upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              File da importare <span className="font-normal text-zinc-400">(PDF, CSV o Excel — max 10 MB ciascuno)</span>
            </label>

            {/* Attached files list */}
            {files.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {files.map((f) => (
                  <div key={f.fileName} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900">
                    <Paperclip className="size-4 shrink-0 text-primary" />
                    <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 truncate">{f.fileName}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(f.fileName)}
                      className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                      <FileX className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Drop zone / add more button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-3 py-5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm text-zinc-500 dark:text-zinc-400 hover:border-primary/70 hover:text-primary transition-colors"
            >
              {files.length === 0
                ? <><Upload className="size-4 shrink-0" /> Clicca per scegliere i file</>
                : <><Plus className="size-4 shrink-0" /> Aggiungi un altro file</>
              }
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.csv,.xlsx,.xls"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-row items-center justify-end gap-3 p-6 border-t border-zinc-500/25">
          <button
            type="button"
            onClick={handleClose}
            className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors text-zinc-900 dark:text-zinc-100"
          >
            <X className="size-4" />
            Annulla
          </button>
          <button
            type="button"
            disabled={files.length === 0 || isSubmitting}
            onClick={handleSubmit}
            className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-primary text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-primary-hover"
          >
            <Send className="size-4" />
            {isSubmitting ? 'Invio...' : 'Invia al team'}
          </button>
        </div>

      </div>
    </Modal>
  );
}
