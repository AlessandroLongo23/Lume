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
import { Callout } from '@/lib/components/shared/ui/Callout';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { StatusDot } from '@/lib/components/shared/ui/StatusDot';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { CellEmpty, tableCardClass, tableClass, tdClass, thClass, theadClass, trClass } from '@/lib/components/shared/ui/table/tableStyles';
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
      <PageHeader
        back={{ href: config.redirectAfterCompletion, label: `Torna a ${config.italianLabel.toLowerCase()}` }}
        title={`Importazione ${config.italianLabel.toLowerCase()}`}
        subtitle={<span className="tabular-nums">{job.source_filename}</span>}
        actions={<JobIdBadge id={job.id} />}
      />

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
        // ds-ignore: the job ID shown as tiny muted text that copies on click; TextButton would underline it in full text colour, Button would give it a control height
        type="button"
        onClick={handleCopy}
        className="text-2xs tabular-nums text-[var(--lume-text-muted)] hover:text-[var(--lume-text-secondary)] transition-colors"
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
    <div className="surface-card flex flex-col items-center justify-center gap-3 py-16">
      <Loader2 className="size-6 animate-spin motion-reduce:animate-none text-[var(--lume-text-muted)]" />
      <p className="text-sm text-[var(--lume-text)]">{labels[job.status]}</p>
      <p className="text-xs text-[var(--lume-text-secondary)]">
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
      <Callout
        tone="info"
        icon={Sparkles}
        title={
          <>
            {totalRows.toLocaleString('it-IT')} righe trovate · {previewCount} in anteprima ·{' '}
            {usedLLM
              ? mappings.some((m) => m.smartTransform)
                ? 'mappatura AI con regole condizionali'
                : 'mappatura AI'
              : 'mappatura automatica'}
          </>
        }
      >
        Controlla che ogni colonna sia abbinata al campo giusto. Le righe non valide saranno scartate al momento della conferma.
      </Callout>

      {/* Mapping editor */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-[var(--lume-text)]">
          Mappatura colonne
        </h2>
        <div className="surface-card divide-y divide-line">
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
        <h2 className="text-sm font-medium text-[var(--lume-text)]">
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
        <span className="text-sm font-medium text-[var(--lume-text)] truncate">{mapping.sourceColumn}</span>
        {sampleValues.filter(Boolean).length > 0 && (
          <span className="text-xs text-[var(--lume-text-secondary)] truncate">
            es: {sampleValues.filter(Boolean).slice(0, 3).join(' · ')}
          </span>
        )}
      </div>
      <ArrowRight className="size-4 text-[var(--lume-text-muted)] mt-2" aria-hidden />
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <Select
            value={mapping.destField ?? null}
            onChange={(v) => onChange((v as string) ?? null)}
            options={destFields.map((f) => ({ value: f, label: destFieldLabels[f] ?? f }))}
            labelKey="label"
            valueKey="value"
            placeholder="Ignora"
            isNullable
            disabled={!!smart}
            size="sm"
            className="flex-1"
          />
          {showConfidence && (mapping.destField || smart) && (
            <ConfidencePill confidence={mapping.confidence} />
          )}
        </div>
        {smart && (
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--lume-text)] w-fit">
              <Sparkles className="size-3 text-[var(--lume-accent)]" aria-hidden />
              Scrive in: {smart.outputs.map((o) => destFieldLabels[o] ?? o).join(' + ')}
            </span>
            {smart.description && (
              <p className="text-xs text-[var(--lume-text-secondary)]">{smart.description}</p>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-fit -ml-2"
              onClick={() => onChange(mapping.destField, true)}
            >
              Usa mappatura semplice
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfidencePill({ confidence }: { confidence: number }) {
  const label = confidence >= 0.8 ? 'Alta' : confidence >= 0.6 ? 'Media' : 'Bassa';
  const tone = confidence >= 0.8 ? 'success' : confidence >= 0.6 ? 'warning' : 'danger';
  return (
    <Tooltip label={`Confidence: ${(confidence * 100).toFixed(0)}%`}>
      <span tabIndex={0} className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-[var(--lume-ring-focus)]">
        <StatusDot tone={tone} className="text-xs">{label}</StatusDot>
      </span>
    </Tooltip>
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
    return <p className="text-sm text-[var(--lume-text-secondary)]">Nessuna riga disponibile per l&apos;anteprima.</p>;
  }
  return (
    <div className={`${tableCardClass} overflow-x-auto`}>
      <table className={tableClass}>
        <thead className={theadClass}>
          <tr>
            <th className={thClass()}>#</th>
            {columns.map((c) => (
              <th key={c.key} className={thClass()}>{c.label}</th>
            ))}
            <th className={`${thClass()} w-8`} aria-label="Stato" />
          </tr>
        </thead>
        <tbody>
          {sample.map((s, i) => {
            const rowData: Record<string, unknown> = s.ok
              ? (s.row as Record<string, unknown>)
              : (s.partialRow ?? {});
            return (
              <tr
                key={i}
                className={`${trClass({ interactive: false })} ${!s.ok ? 'bg-danger-soft' : ''}`}
              >
                <td className={`${tdClass} tabular-nums text-xs text-[var(--lume-text-muted)]`}>{i + 1}</td>
                {columns.map((c) => {
                  const raw = rowData[c.key];
                  const value = raw == null ? '' : String(raw);
                  return (
                    <td key={c.key} className={`${tdClass} max-w-50 truncate`}>
                      {value || <CellEmpty />}
                    </td>
                  );
                })}
                <td className={`${tdClass} align-middle`}>
                  {!s.ok && (
                    <Tooltip label={s.reason} side="left">
                      <span className="inline-flex" tabIndex={0} aria-label={`Errore: ${s.reason}`}>
                        <AlertCircle className="size-4 text-danger-strong" />
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
    <div className="surface-card flex flex-col gap-7 p-6 sm:p-8">
      {/* Header: state + ETA chip */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">
            Importazione in corso
          </h2>
          <p className="text-sm text-[var(--lume-text-secondary)]">
            Stiamo aggiungendo i record di {config.italianLabel.toLowerCase()}, una riga alla volta.
          </p>
        </div>
        {eta && (
          <StatusDot tone="accent" className="shrink-0 text-xs text-[var(--lume-text-secondary)]">{eta}</StatusDot>
        )}
      </div>

      {/* Progress: counts + bar */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <span className="tabular-nums text-sm text-[var(--lume-text)]">
            <span className="text-2xl tracking-tight">
              {touched.toLocaleString('it-IT')}
            </span>
            <span className="text-[var(--lume-text-secondary)]"> / {total.toLocaleString('it-IT')}</span>
          </span>
          <span className="tabular-nums text-sm text-[var(--lume-text-secondary)]">{pct}%</span>
        </div>
        <div
          className="h-2 rounded-full bg-active overflow-hidden"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Avanzamento importazione"
        >
          <div
            className="h-full bg-[var(--lume-accent)] transition-[width] duration-[var(--duration-count)] ease-out motion-reduce:transition-none"
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
      <p className="text-xs text-[var(--lume-text-secondary)]">
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
        <span className="grid place-items-center size-5 rounded-full bg-success-soft text-success-strong">
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}
      {state === 'active' && (
        <span className="grid place-items-center size-5 rounded-full shadow-[inset_0_0_0_1px_var(--lume-edge-hover)]">
          <Loader2 className="size-3 animate-spin motion-reduce:animate-none text-[var(--lume-text)]" />
        </span>
      )}
      {state === 'pending' && (
        <span className="grid place-items-center size-5 rounded-full edge">
          <span className="size-1.5 rounded-full bg-[var(--lume-edge-hover)]" />
        </span>
      )}
      <span
        className={
          state === 'done'
            ? 'text-sm text-[var(--lume-text)]'
            : state === 'active'
              ? 'text-sm font-medium text-[var(--lume-text)]'
              : 'text-sm text-[var(--lume-text-muted)]'
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
  const valueColor = tone === 'danger' ? 'text-danger-strong' : 'text-[var(--lume-text)]';
  return (
    <Tooltip label={hint}>
      <span className="inline-flex items-baseline gap-1.5 cursor-help">
        <span className={`tabular-nums text-sm font-medium ${valueColor}`}>
          {value.toLocaleString('it-IT')}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-[var(--lume-text-secondary)]">
          {label}
          <Info className="size-3 text-[var(--lume-text-muted)]" aria-hidden />
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
    ? 'text-success-strong'
    : 'text-warning-strong';
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
    <div className="surface-card flex flex-col items-center gap-4 p-8 text-center">
      <Icon className={`size-12 ${tone}`} strokeWidth={1.5} aria-hidden />
      <h2 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">
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
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
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
    <Callout tone="warning" icon={Mail} title="Affidato al team Lume">
      {reason ?? 'Il tuo file richiede un\'elaborazione manuale. Ti scriviamo entro 24 ore.'}
    </Callout>
  );
}

function ErrorPanel({ title, message, onBack }: { title: string; message: string; onBack: () => void }) {
  return (
    <Callout
      tone="danger"
      icon={AlertTriangle}
      title={title}
      action={
        <Button variant="secondary" size="sm" leadingIcon={ArrowLeft} onClick={onBack}>
          Torna indietro
        </Button>
      }
    >
      {message}
    </Callout>
  );
}

function CenteredSpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24">
      <Loader2 className="size-6 animate-spin motion-reduce:animate-none text-[var(--lume-text-muted)]" />
      <p className="text-sm text-[var(--lume-text-secondary)]">{label}</p>
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
    success: 'text-success-strong',
    danger: 'text-danger-strong',
    neutral: 'text-[var(--lume-text)]',
  };
  const valueEl = (
    <span className={`text-2xl tabular-nums ${colors[tone]}`}>
      {value.toLocaleString('it-IT')}
    </span>
  );
  return (
    <div className="flex flex-col items-center gap-0.5">
      {valueEl}
      {hint ? (
        <Tooltip label={hint}>
          <span className="inline-flex items-center gap-1 text-xs text-[var(--lume-text-secondary)] cursor-help">
            {label}
            <Info className="size-3 text-[var(--lume-text-muted)]" aria-hidden />
          </span>
        </Tooltip>
      ) : (
        <span className="text-xs text-[var(--lume-text-secondary)]">{label}</span>
      )}
    </div>
  );
}

function escapeCsv(v: unknown): string {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
