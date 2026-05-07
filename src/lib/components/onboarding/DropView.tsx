'use client';

import { useRef, useState, type DragEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, X } from 'lucide-react';
import type { UploadProgress } from './useOnboardingUpload';
import { FileIcon } from './fileIcons';
import { EASE_OUT } from './onboardingTypes';
import { Button } from '@/lib/components/shared/ui/Button';

const ease = EASE_OUT;
const ACCEPT = '.csv,.tsv,.txt,.xlsx,.xls,.json,.pdf';

interface DropViewProps {
  files: File[];
  onChange: (files: File[]) => void;
  onSubmit: () => void;
  onBack: () => void;
  uploads: Record<string, UploadProgress>;
  busy: boolean;
  error: string | null;
}

/**
 * The drop zone. Big, dashed, full-width on the wizard column. File pills
 * fade in with stagger; uploaded ones gain a subtle progress bar that fills
 * as the XHR PUT progresses.
 *
 * No upload happens on this screen — `onSubmit` triggers the parent flow,
 * which calls the upload hook and transitions to MagicView.
 */
export function DropView({ files, onChange, onSubmit, onBack, uploads, busy, error }: DropViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    onChange(dedupByName([...files, ...dropped]));
  }

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    onChange(dedupByName([...files, ...selected]));
    // Allow re-selecting the same file later
    e.target.value = '';
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <motion.div
      key="drop"
      className="w-full max-w-2xl px-8 select-none"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.5, ease }}
    >
      <div className="text-center">
        <h1 className="text-2xl font-light tracking-wide text-foreground">
          Trascina qui i file dal tuo vecchio gestionale
        </h1>
        <p className="mt-2 text-sm font-light text-muted-foreground">
          Excel, CSV, PDF, JSON. Qualsiasi cosa va bene. Niente di troppo grande?
          Massimo 50&nbsp;MB per file.
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={[
          'mt-8 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-all',
          'flex flex-col items-center justify-center min-h-44',
          dragOver
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/60 hover:bg-muted/40',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={handleSelect}
        />
        <p className="text-sm font-light text-muted-foreground">
          {dragOver
            ? 'Lascia pure, ci penso io.'
            : 'Trascina qui i file, oppure '}
          {!dragOver && (
            <span className="text-primary underline-offset-2 hover:underline">scegli dal computer</span>
          )}
        </p>
      </div>

      {files.length > 0 && (
        <ul className="mt-5 space-y-2">
          <AnimatePresence initial={false}>
            {files.map((file, i) => {
              const upload = uploads[file.name];
              return (
                <motion.li
                  key={file.name + i}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3, ease, delay: i * 0.04 }}
                  className="flex items-center gap-3 rounded-xl bg-card border border-border px-4 py-3"
                >
                  <FileIcon filename={file.name} className="size-5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-light text-foreground truncate">
                        {file.name}
                      </span>
                      <span className="text-xs font-light text-muted-foreground shrink-0">
                        {formatSize(file.size)}
                      </span>
                    </div>
                    {upload && upload.state !== 'idle' && (
                      <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className={
                            upload.state === 'error'
                              ? 'h-full bg-destructive'
                              : 'h-full bg-primary'
                          }
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, Math.round((upload.progress ?? 0) * 100))}%` }}
                          transition={{ duration: 0.2, ease: 'linear' }}
                        />
                      </div>
                    )}
                  </div>
                  {!busy && (
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      aria-label={`Rimuovi ${file.name}`}
                      onClick={() => removeAt(i)}
                      className="rounded-full"
                    >
                      <X />
                    </Button>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {error && (
        <p className="mt-4 text-sm text-destructive font-light text-center">{error}</p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors font-light"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Indietro
        </button>
        <Button
          variant="primary"
          onClick={onSubmit}
          disabled={files.length === 0 || busy}
          loading={busy}
        >
          {busy ? 'Carico…' : 'Inizia importazione'}
        </Button>
      </div>
    </motion.div>
  );
}

function dedupByName(files: File[]): File[] {
  const seen = new Set<string>();
  const out: File[] = [];
  for (const f of files) {
    if (seen.has(f.name)) continue;
    seen.add(f.name);
    out.push(f);
  }
  return out;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
