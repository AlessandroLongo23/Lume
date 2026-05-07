'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, X, Upload, Paperclip, FileX, Send, Plus } from 'lucide-react';
import { Modal } from '@/lib/components/shared/ui/modals/Modal';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { Button } from '@/lib/components/shared/ui/Button';
import { supabase } from '@/lib/supabase/client';
import type { ImportEntity } from '@/lib/imports/entities/types';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB (auto pipeline) — concierge path enforces 10 MB at the email layer

type AutoEntity = ImportEntity;

interface PendingFile {
  file: File;
  fileBase64: string | null; // populated only when concierge fallback is used
  fileName: string;
}

interface ConciergeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * When set, the modal uses the automated LLM-assisted import pipeline for
   * the chosen entity. PDFs and unsupported files still fall back to the
   * concierge email flow so the user never gets stranded.
   */
  entity?: AutoEntity;
}

const reviewPath = (jobId: string) => `/admin/imports/${jobId}`;

export function ConciergeImportModal({ isOpen, onClose, entity }: ConciergeImportModalProps) {
  const router = useRouter();
  const [files, setFiles] = useState<PendingFile[]>([]);
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
      messagePopup.getState().error(`${oversized.map((f) => f.name).join(', ')}: supera il limite di 50 MB.`);
    }

    const valid = selected.filter((f) => f.size <= MAX_FILE_SIZE);
    e.target.value = '';

    valid.forEach((file) => {
      setFiles((prev) => {
        if (prev.some((f) => f.fileName === file.name)) return prev;
        return [...prev, { file, fileBase64: null, fileName: file.name }];
      });
    });
  };

  const handleRemoveFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.fileName !== name));
  };

  const isAutoCandidate = (file: File): boolean => {
    if (!entity) return false;
    const ext = file.name.toLowerCase().split('.').pop();
    return ext === 'csv' || ext === 'xlsx' || ext === 'xls' || ext === 'tsv' || ext === 'pdf';
  };

  /** Auto pipeline: init → upload to Storage → start → navigate to review. */
  const submitAuto = async (file: File): Promise<boolean> => {
    if (!entity) return false;

    const initRes = await fetch('/api/imports/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, sizeBytes: file.size, entity }),
    });
    const initJson = await initRes.json();
    if (!initRes.ok || !initJson.success) {
      throw new Error(initJson.error ?? 'Errore inizializzazione import');
    }
    const { jobId, storagePath, uploadToken } = initJson as {
      jobId: string;
      storagePath: string;
      uploadToken: string;
    };

    const { error: upErr } = await supabase.storage
      .from('imports')
      .uploadToSignedUrl(storagePath, uploadToken, file, { upsert: true });
    if (upErr) throw new Error(`Upload fallito: ${upErr.message}`);

    const startRes = await fetch('/api/imports/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });
    const startJson = await startRes.json();
    if (!startRes.ok || !startJson.success) {
      throw new Error(startJson.error ?? 'Errore avvio elaborazione');
    }

    router.push(reviewPath(jobId));
    return true;
  };

  /** Concierge fallback: base64 the files and email them to the team. */
  const submitConcierge = async (pending: PendingFile[]): Promise<void> => {
    const filesPayload = await Promise.all(
      pending.map(async (p) => ({
        fileName: p.fileName,
        fileBase64: p.fileBase64 ?? (await fileToBase64(p.file)),
      })),
    );
    const res = await fetch('/api/migration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: filesPayload }),
    });
    if (!res.ok) throw new Error('request failed');
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;

    setIsSubmitting(true);
    try {
      // Auto pipeline accepts one file at a time; pick the first eligible one
      // and route the rest (or unsupported types) through concierge.
      const first = files[0];
      if (entity && isAutoCandidate(first.file) && files.length === 1) {
        const ok = await submitAuto(first.file);
        if (ok) {
          handleClose();
          return;
        }
      }

      await submitConcierge(files);
      messagePopup.getState().success('File ricevuto! Il nostro team importerà i tuoi dati nelle prossime 24 ore.');
      handleClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore durante l\'invio. Riprova.';
      messagePopup.getState().error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showAutoHint = !!entity && files.length === 1 && isAutoCandidate(files[0].file);

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
          <Button variant="ghost" size="md" iconOnly aria-label="Chiudi" onClick={handleClose} className="shrink-0 ml-4">
            <X />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Non perdere tempo a ricopiare i dati a mano. Carica il PDF o l&apos;Excel del tuo vecchio gestionale
            {entity ? ' e Lume mappa automaticamente i dati sul tuo salone.' : ' e il nostro team si occuperà di importare tutto '}
            {!entity && <strong className="text-zinc-900 dark:text-zinc-100">in meno di 24 ore</strong>}{!entity && '.'}
          </p>

          {showAutoHint && (
            <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
              <Sparkles className="size-4 shrink-0 mt-0.5" />
              <span>Importazione automatica disponibile per questo file. Vedrai un&apos;anteprima prima di confermare.</span>
            </div>
          )}

          {/* File upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              File da importare <span className="font-normal text-zinc-400">(PDF, CSV o Excel — max 50 MB ciascuno)</span>
            </label>

            {/* Attached files list */}
            {files.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {files.map((f) => (
                  <div key={f.fileName} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900">
                    <Paperclip className="size-4 shrink-0 text-primary" />
                    <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 truncate">{f.fileName}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      aria-label={`Rimuovi ${f.fileName}`}
                      onClick={() => handleRemoveFile(f.fileName)}
                      className="shrink-0"
                    >
                      <FileX />
                    </Button>
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
          <Button variant="secondary" leadingIcon={X} onClick={handleClose}>
            Annulla
          </Button>
          <Button
            variant="primary"
            leadingIcon={Send}
            disabled={files.length === 0 || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting
              ? (showAutoHint ? 'Caricamento...' : 'Invio...')
              : (showAutoHint ? 'Importa subito' : 'Invia al team')}
          </Button>
        </div>

      </div>
    </Modal>
  );
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const raw = result.split(',')[1];
      resolve(raw);
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}
