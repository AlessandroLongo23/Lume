'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, X } from 'lucide-react';
import type { UploadProgress } from './useOnboardingUpload';
import { FileIcon } from './fileIcons';
import { EASE_OUT } from './onboardingTypes';
import { Button } from '@/lib/components/shared/ui/Button';
import { DURATION } from '@/lib/const/motion';
import { Callout } from '@/lib/components/shared/ui/Callout';
import { FileDropZone } from './FileDropZone';
import { OnboardingTitle } from './OnboardingTitle';

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
      transition={{ duration: DURATION.enter, ease }}
    >
      <OnboardingTitle title="Trascina qui i file dal tuo vecchio gestionale" size="md" animate={false}>
        Excel, CSV, PDF, JSON. Qualsiasi cosa va bene. Niente di troppo grande?
        Massimo 50&nbsp;MB per file.
      </OnboardingTitle>

      <FileDropZone
        size="lg"
        multiple
        accept={ACCEPT}
        onFiles={(picked) => onChange(dedupByName([...files, ...picked]))}
        prompt="Trascina qui i file, oppure"
        action="scegli dal computer"
        dragPrompt="Lascia pure, ci penso io."
        className="mt-8"
      />

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
                  transition={{ duration: DURATION.slow, ease, delay: i * 0.04 }}
                  className="surface-card flex items-center gap-3 px-4 py-3"
                >
                  <FileIcon filename={file.name} className="size-5 shrink-0 text-[var(--lume-text-muted)]" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-light text-[var(--lume-text)] truncate">
                        {file.name}
                      </span>
                      <span className="text-xs font-light text-[var(--lume-text-muted)] shrink-0">
                        {formatSize(file.size)}
                      </span>
                    </div>
                    {upload && upload.state !== 'idle' && (
                      <div className="mt-2 h-1 rounded-full bg-active overflow-hidden">
                        <motion.div
                          className={
                            upload.state === 'error'
                              ? 'h-full bg-danger-strong'
                              : 'h-full bg-[var(--lume-text)]'
                          }
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, Math.round((upload.progress ?? 0) * 100))}%` }}
                          transition={{ duration: DURATION.base, ease: 'linear' }}
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

      {error && <Callout tone="danger" title={error} className="mt-4" />}

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" leadingIcon={ArrowLeft} onClick={onBack} disabled={busy} className="-ml-3 font-normal">
          Indietro
        </Button>
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
