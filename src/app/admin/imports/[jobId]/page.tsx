'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Mail,
  FileWarning,
  X,
  ArrowRight,
  AlertCircle,
  Check,
  Info,
} from 'lucide-react';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { ConfirmDialog } from '@/lib/components/shared/ui/modals/ConfirmDialog';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { Button } from '@/lib/components/shared/ui/Button';
import { useRealtimeStore } from '@/lib/hooks/useRealtimeStore';
import { useImportsStore } from '@/lib/stores/imports';
import { getEntityConfig } from '@/lib/imports/entities/registry';
import type { ColumnMapping, EntityImportConfig, PreviewColumn, RowResult } from '@/lib/imports/entities/types';
import type { ImportJob } from '@/lib/types/ImportJob';

const DUPLICATI_HINT =
  'Righe con lo stesso identificativo di un record già esistente. Vengono saltate per non creare duplicati.';
const NON_VALIDE_HINT =
  'Righe scartate perché mancavano dati obbligatori o avevano un formato non riconoscibile.';
const IMPORTATI_HINT_BY_ENTITY: Record<string, string> = {
  clients: 'Clienti aggiunti correttamente al tuo archivio.',
  productCategories: 'Categorie aggiunte correttamente.',
  manufacturers: 'Marchi aggiunti correttamente.',
  suppliers: 'Fornitori aggiunti correttamente.',
  serviceCategories: 'Categorie servizi aggiunte correttamente.',
  operators: 'Operatori aggiunti correttamente.',
  products: 'Prodotti aggiunti correttamente.',
  services: 'Servizi aggiunti correttamente.',
};

export default function ImportReviewPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const router = useRouter();
  const job = useImportsStore((s) => s.current);
  const fetchJob = useImportsStore((s) => s.fetchJob);
  const isLoading = useImportsStore((s) => s.isLoading);

  // Initial fetch + Realtime subscription on this single job row
  useEffect(() => {
    fetchJob(jobId);
  }, [jobId, fetchJob]);

  useRealtimeStore('import_jobs', () => fetchJob(jobId), job?.salon_id ?? null);

  // Polling fallback for transitional states. Realtime can be slow to connect
  // (or RLS-filtered out on first connect), so we always poll while the
  // background pipeline is running. Stops as soon as the job lands in a state
  // that requires user action or is finished.
  useEffect(() => {
    const transitional = !job
      || job.status === 'uploading'
      || job.status === 'queued'
      || job.status === 'parsing'
      || job.status === 'committing';
    if (!transitional) return;
    const interval = setInterval(() => fetchJob(jobId), 2000);
    return () => clearInterval(interval);
  }, [jobId, job, fetchJob]);

  // Resolve config once we know the entity. If the entity isn't registered
  // (legacy job? out-of-band insert? onboarding child still being classified?),
  // surface a clean error.
  const config = useMemo(() => {
    if (!job || !job.entity) return null;
    try {
      return getEntityConfig(job.entity);
    } catch {
      return null;
    }
  }, [job]);

  if (isLoading && !job) {
    return <CenteredSpinner label="Carico l'import..." />;
  }
  if (!job) {
    return (
      <ErrorPanel
        title="Import non trovato"
        message="Questo import non esiste o non hai i permessi per vederlo."
        onBack={() => router.push('/admin/clienti')}
      />
    );
  }
  if (!config) {
    return (
      <ErrorPanel
        title="Tipo di import non supportato"
        message={`Il tipo '${job.entity ?? 'non classificato'}' non è gestito dal client. Contatta il supporto Lume.`}
        onBack={() => router.push('/admin/clienti')}
      />
    );
  }

  const importedHint = job.entity ? IMPORTATI_HINT_BY_ENTITY[job.entity] ?? 'Record aggiunti correttamente.' : 'Record aggiunti correttamente.';

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={ArrowLeft}
          onClick={() => router.push(config.redirectAfterCompletion)}
        >
          Torna a {config.italianLabel.toLowerCase()}
        </Button>
        <JobIdBadge id={job.id} />
      </header>

      <div className="flex flex-col gap-1.5 min-w-0">
        <h1 className="text-3xl font-bold tracking-tight leading-tight text-foreground truncate">
          Importazione {config.italianLabel.toLowerCase()}
        </h1>
        <p className="text-sm font-mono text-muted-foreground truncate">{job.source_filename}</p>
      </div>

      <StatusRouter job={job} jobId={jobId} config={config} importedHint={importedHint} />
    </div>
  );
}

function JobIdBadge({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable; silent */
    }
  };
  return (
    <Tooltip label={copied ? 'Copiato' : 'ID dell\'importazione. Clicca per copiare — utile per il supporto.'}>
      <button
        type="button"
        onClick={handleCopy}
        className="text-[11px] text-muted-foreground/70 font-mono hover:text-muted-foreground transition-colors"
      >
        {id.slice(0, 8)}
      </button>
    </Tooltip>
  );
}

function StatusRouter({
  job,
  jobId,
  config,
  importedHint,
}: {
  job: ImportJob;
  jobId: string;
  config: EntityImportConfig;
  importedHint: string;
}) {
  const router = useRouter();
  const onReturn = () => router.push(config.redirectAfterCompletion);

  switch (job.status) {
    case 'uploading':
    case 'queued':
    case 'parsing':
      return <ParsingPanel job={job} />;
    case 'awaiting_review':
      return <ReviewPanel job={job} jobId={jobId} config={config} />;
    case 'committing':
      return <CommittingPanel job={job} importedHint={importedHint} config={config} />;
    case 'completed':
    case 'partial_failure':
      return <CompletedPanel job={job} onReturn={onReturn} importedHint={importedHint} config={config} />;
    case 'needs_concierge':
      return <ConciergePanel reason={job.failure_reason} />;
    case 'failed':
      return (
        <ErrorPanel
          title="Importazione fallita"
          message={job.failure_reason ?? 'Si è verificato un errore imprevisto.'}
          onBack={onReturn}
        />
      );
    case 'cancelled':
      return (
        <ErrorPanel
          title="Importazione annullata"
          message="Hai annullato questa importazione."
          onBack={onReturn}
        />
      );
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

function ParsingPanel({ job }: { job: ImportJob }) {
  const labels: Partial<Record<ImportJob['status'], string>> = {
    uploading: 'Caricamento del file...',
    queued: 'In coda — attendo un worker libero...',
    parsing: 'Sto leggendo il file e mappando le colonne...',
  };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 rounded-lg border border-border bg-card">
      <Loader2 className="size-6 animate-spin text-primary" />
      <p className="text-sm text-foreground">{labels[job.status]}</p>
      <p className="text-xs text-muted-foreground">
        Continua anche se chiudi questa pagina.
      </p>
    </div>
  );
}

function ReviewPanel({ job, jobId, config }: { job: ImportJob; jobId: string; config: EntityImportConfig }) {
  const router = useRouter();
  const initialMappings = job.mapping_json?.mappings ?? [];
  const [mappings, setMappings] = useState<ColumnMapping[]>(initialMappings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const usedLLM = job.preview_json?.usedLLM ?? false;
  const sample = job.preview_json?.sample ?? [];
  const sourceSample = job.preview_json?.sourceSample ?? [];

  const updateMapping = (sourceColumn: string, destField: string | null, clearSmart = false) => {
    setMappings((prev) =>
      prev.map((m) => {
        if (m.sourceColumn !== sourceColumn) return m;
        const next: ColumnMapping = {
          ...m,
          destField,
          confidence: destField === null ? 0 : 1,
        };
        if (clearSmart) delete next.smartTransform;
        return next;
      }),
    );
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/imports/${jobId}/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mappings }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Errore conferma');
      messagePopup.getState().success('Importazione avviata.');
    } catch (err) {
      messagePopup.getState().error(err instanceof Error ? err.message : 'Errore conferma');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setShowCancelConfirm(false);
    await fetch(`/api/imports/${jobId}/cancel`, { method: 'POST' });
    router.push(config.redirectAfterCompletion);
  };

  const totalRows = job.total_rows ?? 0;
  const previewCount = job.preview_json?.previewRowCount ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg border border-primary/30 bg-primary/5">
        <Sparkles className="size-5 text-primary shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <p className="text-sm text-foreground">
            <strong>{totalRows.toLocaleString('it-IT')}</strong> righe trovate ·{' '}
            <strong>{previewCount}</strong> in anteprima ·{' '}
            <strong>
              {usedLLM
                ? mappings.some((m) => m.smartTransform)
                  ? 'mappatura AI con regole condizionali'
                  : 'mappatura AI'
                : 'mappatura automatica'}
            </strong>
          </p>
          <p className="text-xs text-muted-foreground">
            Controlla che ogni colonna sia abbinata al campo giusto. Le righe non valide saranno scartate al momento della conferma.
          </p>
        </div>
      </div>

      {/* Mapping editor */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.04em]">
          Mappatura colonne
        </h2>
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {mappings.map((m) => (
            <MappingRow
              key={m.sourceColumn}
              mapping={m}
              destFields={config.destFields}
              destFieldLabels={config.destFieldLabels}
              sampleValues={sourceSample
                .slice(0, 3)
                .map((row) => row[m.sourceColumn] ?? '')
                .filter((v) => v.trim().length > 0)}
              showConfidence={usedLLM}
              onChange={(dest, clearSmart) => updateMapping(m.sourceColumn, dest, clearSmart)}
            />
          ))}
        </div>
      </section>

      {/* Preview table */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.04em]">
          Anteprima righe trasformate
        </h2>
        <PreviewTable sample={sample} columns={config.previewColumns} />
      </section>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          variant="secondary"
          leadingIcon={X}
          onClick={() => setShowCancelConfirm(true)}
        >
          Annulla
        </Button>
        <Button
          variant="primary"
          loading={isSubmitting}
          leadingIcon={ArrowRight}
          onClick={handleConfirm}
        >
          {isSubmitting ? 'Avvio...' : `Conferma e importa ${totalRows.toLocaleString('it-IT')} righe`}
        </Button>
      </div>

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancel}
        title="Annullare questo import?"
        description="Le righe già caricate verranno scartate e non potrai più riprendere da qui."
        confirmLabel="Annulla import"
        cancelLabel="Continua"
        tone="warning"
      />
    </div>
  );
}

function MappingRow({
  mapping,
  destFields,
  destFieldLabels,
  sampleValues,
  showConfidence,
  onChange,
}: {
  mapping: ColumnMapping;
  destFields: readonly string[];
  destFieldLabels: Record<string, string>;
  sampleValues: string[];
  showConfidence: boolean;
  onChange: (dest: string | null, clearSmart?: boolean) => void;
}) {
  const smart = mapping.smartTransform;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 px-4 py-3">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium text-foreground truncate">{mapping.sourceColumn}</span>
        {sampleValues.filter(Boolean).length > 0 && (
          <span className="text-xs text-muted-foreground/80 truncate">
            es: {sampleValues.filter(Boolean).slice(0, 3).join(' · ')}
          </span>
        )}
      </div>
      <ArrowRight className="size-4 text-muted-foreground/60 mt-2" />
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <select
            value={mapping.destField ?? ''}
            disabled={!!smart}
            onChange={(e) => onChange(e.target.value ? e.target.value : null)}
            className="flex-1 px-3 py-1.5 text-sm rounded-md border border-input bg-card text-foreground disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">Ignora</option>
            {destFields.map((f) => (
              <option key={f} value={f}>{destFieldLabels[f] ?? f}</option>
            ))}
          </select>
          {showConfidence && (mapping.destField || smart) && (
            <ConfidencePill confidence={mapping.confidence} />
          )}
        </div>
        {smart && (
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary w-fit">
              <Sparkles className="size-3" />
              Scrive in: {smart.outputs.map((o) => destFieldLabels[o] ?? o).join(' + ')}
            </span>
            {smart.description && (
              <p className="text-xs text-muted-foreground/80">{smart.description}</p>
            )}
            <button
              type="button"
              className="text-[11px] text-muted-foreground hover:text-foreground underline w-fit"
              onClick={() => onChange(mapping.destField, true)}
            >
              Usa mappatura semplice
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfidencePill({ confidence }: { confidence: number }) {
  const label = confidence >= 0.8 ? 'Alta' : confidence >= 0.6 ? 'Media' : 'Bassa';
  const tone =
    confidence >= 0.8
      ? 'bg-[var(--lume-success-bg)] text-[var(--lume-success-fg)] border border-[var(--lume-success-border)]'
      : confidence >= 0.6
        ? 'bg-[var(--lume-warning-bg)] text-[var(--lume-warning-fg)] border border-[var(--lume-warning-border)]'
        : 'bg-[var(--lume-danger-bg)] text-[var(--lume-danger-fg)] border border-[var(--lume-danger-border)]';
  return (
    <span
      className={`text-[11px] font-medium px-2 py-0.5 rounded ${tone}`}
      title={`Confidence: ${(confidence * 100).toFixed(0)}%`}
    >
      {label}
    </span>
  );
}

function PreviewTable({
  sample,
  columns,
}: {
  sample: RowResult[];
  columns: readonly PreviewColumn[];
}) {
  if (!sample || sample.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Nessuna riga disponibile per l&apos;anteprima.</p>;
  }
  return (
    <div className="rounded-lg border border-border bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-[0.04em]">#</th>
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-[0.04em]">{c.label}</th>
            ))}
            <th className="w-8 px-3 py-2" aria-label="Stato" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sample.map((s, i) => {
            const rowData: Record<string, unknown> = s.ok
              ? (s.row as Record<string, unknown>)
              : (s.partialRow ?? {});
            return (
              <tr
                key={i}
                className={!s.ok ? 'bg-[var(--lume-danger-bg)]/50' : undefined}
              >
                <td className="px-3 py-2 text-xs text-muted-foreground/70 font-mono">{i + 1}</td>
                {columns.map((c) => {
                  const raw = rowData[c.key];
                  const value = raw == null ? '' : String(raw);
                  return (
                    <td key={c.key} className="px-3 py-2 text-foreground/80 max-w-[200px] truncate">
                      {value || <span className="text-muted-foreground/60">—</span>}
                    </td>
                  );
                })}
                <td className="px-3 py-2 align-middle">
                  {!s.ok && (
                    <Tooltip label={s.reason} side="left">
                      <span className="inline-flex" tabIndex={0} aria-label={`Errore: ${s.reason}`}>
                        <AlertCircle className="size-4 text-destructive" />
                      </span>
                    </Tooltip>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Committing panel ────────────────────────────────────────────────────────

function formatEta(secsLeft: number): string {
  if (secsLeft < 5) return 'quasi pronto';
  if (secsLeft < 60) {
    const rounded = Math.max(5, Math.round(secsLeft / 5) * 5);
    return `circa ${rounded} secondi`;
  }
  const mins = Math.round(secsLeft / 60);
  return `circa ${mins} ${mins === 1 ? 'minuto' : 'minuti'}`;
}

function useEta(processed: number, total: number): string | null {
  // Tracks throughput from the first processed-row count we see, then projects
  // remaining time. Suppressed for the first ~4s to avoid jumpy ETAs on
  // sub-30s imports.
  const startRef = useRef<{ rows: number; at: number } | null>(null);
  const [eta, setEta] = useState<string | null>(null);

  useEffect(() => {
    if (startRef.current === null) {
      startRef.current = { rows: processed, at: Date.now() };
      return;
    }
    const start = startRef.current;
    const elapsed = (Date.now() - start.at) / 1000;
    const delta = processed - start.rows;
    if (elapsed < 4 || delta < 3) return;
    const throughput = delta / elapsed;
    if (throughput <= 0) return;
    const remaining = Math.max(0, total - processed);
    setEta(formatEta(remaining / throughput));
  }, [processed, total]);

  return eta;
}

function CommittingPanel({
  job,
  importedHint,
  config,
}: {
  job: ImportJob;
  importedHint: string;
  config: EntityImportConfig;
}) {
  const total = job.total_rows ?? 0;
  // `processed_rows` only counts successful inserts. Real progress (rows the
  // worker has *touched*) also includes duplicates and failed rows, so the
  // bar can reach 100% even when the file isn't all importable.
  const inserted = job.processed_rows;
  const touched = inserted + job.skipped_rows + job.failed_rows;
  const pct = total > 0 ? Math.min(100, Math.round((touched / total) * 100)) : 0;
  const eta = useEta(touched, total);

  return (
    <div className="flex flex-col gap-7 p-6 sm:p-8 rounded-lg border border-border bg-card">
      {/* Header: state + ETA chip */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground">
            Importazione in corso
          </h2>
          <p className="text-sm text-muted-foreground">
            Stiamo aggiungendo i record di {config.italianLabel.toLowerCase()}, una riga alla volta.
          </p>
        </div>
        {eta && (
          <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/25 bg-primary/5 text-[11px] font-medium text-primary">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping motion-reduce:hidden" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            {eta}
          </span>
        )}
      </div>

      {/* Progress: counts + bar */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-sm text-foreground">
            <span className="text-2xl font-semibold tracking-tight">
              {touched.toLocaleString('it-IT')}
            </span>
            <span className="text-muted-foreground"> / {total.toLocaleString('it-IT')}</span>
          </span>
          <span className="font-mono text-sm text-muted-foreground tabular-nums">{pct}%</span>
        </div>
        <div
          className="h-2 rounded-full bg-muted overflow-hidden"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Avanzamento importazione"
        >
          <div
            className="h-full bg-primary transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Activity timeline */}
      <ol className="flex flex-col gap-3">
        <TimelineStep state="done" label="Lettura del file" />
        <TimelineStep state="done" label="Mappatura delle colonne" />
        <TimelineStep state="active" label={`Aggiunta di ${config.italianLabel.toLowerCase()}`} />
        <TimelineStep state="pending" label="Verifica finale" />
      </ol>

      {/* Stats: importati / duplicati / non valide */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <StatChip
          label="Importati"
          value={inserted}
          hint={importedHint}
        />
        {job.skipped_rows > 0 && (
          <StatChip
            label="Duplicati saltati"
            value={job.skipped_rows}
            hint={DUPLICATI_HINT}
          />
        )}
        {job.failed_rows > 0 && (
          <StatChip
            label="Righe non valide"
            value={job.failed_rows}
            hint={NON_VALIDE_HINT}
            tone="danger"
          />
        )}
      </div>

      {/* Reassurance footer */}
      <p className="text-xs text-muted-foreground">
        Puoi chiudere la pagina: l&apos;importazione continua sul nostro server e ritrovi
        i dati aggiornati appena è pronta.
      </p>
    </div>
  );
}

function TimelineStep({
  state,
  label,
}: {
  state: 'done' | 'active' | 'pending';
  label: string;
}) {
  return (
    <li className="flex items-center gap-3">
      {state === 'done' && (
        <span className="grid place-items-center size-5 rounded-full bg-[var(--lume-success-bg)] text-[var(--lume-success-fg)]">
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}
      {state === 'active' && (
        <span className="grid place-items-center size-5 rounded-full bg-primary/10 ring-1 ring-primary/30">
          <Loader2 className="size-3 animate-spin motion-reduce:animate-none text-primary" />
        </span>
      )}
      {state === 'pending' && (
        <span className="grid place-items-center size-5 rounded-full border border-border bg-transparent">
          <span className="size-1.5 rounded-full bg-muted-foreground/40" />
        </span>
      )}
      <span
        className={
          state === 'done'
            ? 'text-sm text-foreground'
            : state === 'active'
              ? 'text-sm font-medium text-foreground'
              : 'text-sm text-muted-foreground/70'
        }
      >
        {label}
      </span>
    </li>
  );
}

function StatChip({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  hint: string;
  tone?: 'neutral' | 'danger';
}) {
  const valueColor = tone === 'danger' ? 'text-destructive' : 'text-foreground';
  return (
    <Tooltip label={hint}>
      <span className="inline-flex items-baseline gap-1.5 cursor-help">
        <span className={`font-mono text-sm font-semibold tabular-nums ${valueColor}`}>
          {value.toLocaleString('it-IT')}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          {label}
          <Info className="size-3 text-muted-foreground/60" />
        </span>
      </span>
    </Tooltip>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function CompletedPanel({
  job,
  onReturn,
  importedHint,
  config,
}: {
  job: ImportJob;
  onReturn: () => void;
  importedHint: string;
  config: EntityImportConfig;
}) {
  const isFull = job.status === 'completed';
  const Icon = isFull ? CheckCircle2 : AlertTriangle;
  const tone = isFull
    ? 'text-[var(--lume-success-fg)]'
    : 'text-[var(--lume-warning-fg)]';
  const errors = job.error_log?.rows ?? [];

  const downloadErrors = () => {
    if (errors.length === 0) return;
    const headers = ['rowIndex', 'reason', ...Object.keys(errors[0]?.rawValues ?? {})];
    const rows = errors.map((r) => {
      const raw = r.rawValues ?? {};
      const cells = [r.rowIndex, r.reason, ...headers.slice(2).map((h) => raw[h] ?? '')];
      return cells.map(escapeCsv).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-errori-${job.id.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-8 rounded-lg border border-border bg-card text-center">
      <Icon className={`size-12 ${tone}`} />
      <h2 className="text-lg font-semibold text-foreground">
        {isFull ? 'Importazione completata' : 'Importazione completata (con errori)'}
      </h2>
      <div className="grid grid-cols-3 gap-6 text-sm">
        <Stat label="Importati" value={job.processed_rows} tone="success" hint={importedHint} />
        <Stat label="Duplicati saltati" value={job.skipped_rows} tone="neutral" hint={DUPLICATI_HINT} />
        <Stat
          label="Righe non valide"
          value={job.failed_rows}
          tone={job.failed_rows > 0 ? 'danger' : 'neutral'}
          hint={NON_VALIDE_HINT}
        />
      </div>
      <div className="flex items-center gap-3 pt-2">
        {errors.length > 0 && (
          <Button variant="secondary" leadingIcon={FileWarning} onClick={downloadErrors}>
            Scarica report errori
          </Button>
        )}
        <Button variant="primary" trailingIcon={ArrowRight} onClick={onReturn}>
          Vai a {config.italianLabel.toLowerCase()}
        </Button>
      </div>
    </div>
  );
}

function ConciergePanel({ reason }: { reason: string | null }) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 rounded-lg border border-[var(--lume-warning-border)] bg-[var(--lume-warning-bg)] text-center">
      <Mail className="size-12 text-[var(--lume-warning-fg)]" />
      <h2 className="text-lg font-semibold text-foreground">
        Affidato al team Lume
      </h2>
      <p className="text-sm text-muted-foreground max-w-md">
        {reason ?? 'Il tuo file richiede un\'elaborazione manuale. Ti scriviamo entro 24 ore.'}
      </p>
    </div>
  );
}

function ErrorPanel({ title, message, onBack }: { title: string; message: string; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 rounded-lg border border-[var(--lume-danger-border)] bg-[var(--lume-danger-bg)] text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="secondary" leadingIcon={ArrowLeft} onClick={onBack}>
        Torna indietro
      </Button>
    </div>
  );
}

function CenteredSpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24">
      <Loader2 className="size-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: number;
  tone: 'success' | 'danger' | 'neutral';
  hint?: string;
}) {
  const colors: Record<typeof tone, string> = {
    success: 'text-[var(--lume-success-fg)]',
    danger: 'text-destructive',
    neutral: 'text-foreground',
  };
  const valueEl = (
    <span className={`text-2xl font-semibold font-mono tabular-nums ${colors[tone]}`}>
      {value.toLocaleString('it-IT')}
    </span>
  );
  return (
    <div className="flex flex-col items-center gap-0.5">
      {valueEl}
      {hint ? (
        <Tooltip label={hint}>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground uppercase tracking-[0.04em] cursor-help">
            {label}
            <Info className="size-3 text-muted-foreground/60" />
          </span>
        </Tooltip>
      ) : (
        <span className="text-[11px] text-muted-foreground uppercase tracking-[0.04em]">{label}</span>
      )}
    </div>
  );
}

function escapeCsv(v: unknown): string {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
