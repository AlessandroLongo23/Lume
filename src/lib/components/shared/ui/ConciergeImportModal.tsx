'use client';

import { useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Upload, Paperclip, FileX, Send, Plus } from 'lucide-react';
import { Modal } from '@/lib/components/shared/ui/modals/Modal';
import { DialogFooter, DialogHeader } from '@/lib/components/shared/ui/modals/dialogParts';
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
  const titleId = useId();

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
    <Modal isOpen={isOpen} onClose={handleClose} classes="max-w-lg" labelledBy={titleId}>
      <>
        <DialogHeader
          titleId={titleId}
          title="Migrazione gratuita"
          subtitle="Inclusa nel tuo abbonamento"
          onClose={handleClose}
          divider
        />

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          <p className="text-sm text-[var(--lume-text-secondary)] leading-relaxed">
            Non perdere tempo a ricopiare i dati a mano. Carica il PDF o l&apos;Excel del tuo vecchio gestionale
            {entity ? ' e Lume mappa automaticamente i dati sul tuo salone.' : ' e il nostro team si occuperà di importare tutto '}
            {!entity && <span className="font-medium text-[var(--lume-text)]">in meno di 24 ore</span>}{!entity && '.'}
          </p>

          {showAutoHint && (
            <div className="flex items-start gap-2 text-sm text-[var(--lume-text)]">
              <Sparkles className="size-4 shrink-0 mt-0.5 text-info-strong" aria-hidden />
              <span>Importazione automatica disponibile per questo file. Vedrai un&apos;anteprima prima di confermare.</span>
            </div>
          )}

          {/* File upload */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-[var(--lume-text)]">
              File da importare{' '}
              <span className="font-normal text-[var(--lume-text-muted)]">(PDF, CSV o Excel, massimo 50 MB ciascuno)</span>
            </p>

            {/* Attached files list */}
            {files.length > 0 && (
              <div className="flex flex-col rounded-lg shadow-[inset_0_0_0_1px_var(--lume-line)] divide-y divide-line">
                {files.map((f) => (
                  <div key={f.fileName} className="flex items-center gap-2 pl-3 pr-1 py-1">
                    <Paperclip className="size-4 shrink-0 text-[var(--lume-text-muted)]" aria-hidden />
                    <span className="flex-1 text-sm text-[var(--lume-text)] truncate">{f.fileName}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      aria-label={`Rimuovi ${f.fileName}`}
                      onClick={() => handleRemoveFile(f.fileName)}
                      className="pointer-coarse:size-11"
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
              className="flex items-center justify-center gap-2 px-3 py-5 rounded-lg border border-dashed border-[var(--lume-edge-hover)] text-sm text-[var(--lume-text-secondary)] hover:bg-hover hover:text-[var(--lume-text)] transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lume-ring-focus)]"
            >
              {files.length === 0
                ? <><Upload className="size-4 shrink-0" aria-hidden /> Clicca per scegliere i file</>
                : <><Plus className="size-4 shrink-0" aria-hidden /> Aggiungi un altro file</>
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

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            Annulla
          </Button>
          <Button
            variant="primary"
            leadingIcon={Send}
            disabled={files.length === 0}
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting
              ? (showAutoHint ? 'Caricamento…' : 'Invio…')
              : (showAutoHint ? 'Importa subito' : 'Invia al team')}
          </Button>
        </DialogFooter>
      </>
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
