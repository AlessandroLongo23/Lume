'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, AlertTriangle, Loader2, Sparkles, Mail, FileWarning, X, ArrowRight } from 'lucide-react';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useRealtimeStore } from '@/lib/hooks/useRealtimeStore';
import { useImportsStore } from '@/lib/stores/imports';
import { ALL_CLIENT_DEST_FIELDS, type ClientDestField } from '@/lib/imports/clientHeaderDictionary';
import type { ColumnMapping } from '@/lib/imports/llmMapper';
import type { ImportJob } from '@/lib/types/ImportJob';

const DEST_FIELD_LABELS: Record<ClientDestField, string> = {
  firstName: 'Nome',
  lastName: 'Cognome',
  fullName: 'Nome completo (verrà diviso)',
  email: 'Email',
  phoneRaw: 'Telefono (combinato)',
  phonePrefix: 'Prefisso telefonico',
  phoneNumber: 'Numero (senza prefisso)',
  gender: 'Sesso',
  birthDate: 'Data di nascita',
  isTourist: 'Cliente turista',
  note: 'Note',
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

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between">
        <button
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          onClick={() => router.push('/admin/clienti')}
        >
          <ArrowLeft className="size-4" /> Torna ai clienti
        </button>
        <span className="text-xs text-zinc-400 font-mono">{job.id.slice(0, 8)}</span>
      </header>

      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Importazione clienti
        </h1>
        <p className="text-sm text-zinc-500">{job.source_filename}</p>
      </div>

      <StatusRouter job={job} jobId={jobId} />
    </div>
  );
}

function StatusRouter({ job, jobId }: { job: ImportJob; jobId: string }) {
  const router = useRouter();

  switch (job.status) {
    case 'uploading':
    case 'queued':
    case 'parsing':
      return <ParsingPanel job={job} />;
    case 'awaiting_review':
      return <ReviewPanel job={job} jobId={jobId} />;
    case 'committing':
      return <CommittingPanel job={job} />;
    case 'completed':
    case 'partial_failure':
      return <CompletedPanel job={job} onReturn={() => router.push('/admin/clienti')} />;
    case 'needs_concierge':
      return <ConciergePanel reason={job.failure_reason} />;
    case 'failed':
      return (
        <ErrorPanel
          title="Importazione fallita"
          message={job.failure_reason ?? 'Si è verificato un errore imprevisto.'}
          onBack={() => router.push('/admin/clienti')}
        />
      );
    case 'cancelled':
      return (
        <ErrorPanel
          title="Importazione annullata"
          message="Hai annullato questa importazione."
          onBack={() => router.push('/admin/clienti')}
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
    <div className="flex flex-col items-center justify-center gap-3 py-16 rounded-lg border border-zinc-500/20 bg-zinc-50 dark:bg-zinc-800">
      <Loader2 className="size-6 animate-spin text-primary" />
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{labels[job.status]}</p>
      <p className="text-xs text-zinc-400">Aggiornamento automatico — non chiudere la pagina.</p>
    </div>
  );
}

function ReviewPanel({ job, jobId }: { job: ImportJob; jobId: string }) {
  const router = useRouter();
  const initialMappings = job.mapping_json?.mappings ?? [];
  const [mappings, setMappings] = useState<ColumnMapping[]>(initialMappings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const usedLLM = job.preview_json?.usedLLM ?? false;
  const sample = job.preview_json?.sample ?? [];

  const updateMapping = (sourceColumn: string, destField: ClientDestField | null) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.sourceColumn === sourceColumn
          ? { ...m, destField, confidence: destField === null ? 0 : 1 }
          : m,
      ),
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
    if (!confirm('Annullare questo import?')) return;
    await fetch(`/api/imports/${jobId}/cancel`, { method: 'POST' });
    router.push('/admin/clienti');
  };

  const sampleHeaders = useMemo(
    () => mappings.map((m) => m.sourceColumn),
    [mappings],
  );

  const totalRows = job.total_rows ?? 0;
  const previewCount = job.preview_json?.previewRowCount ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg border border-primary/30 bg-primary/5">
        <Sparkles className="size-5 text-primary shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <p className="text-sm text-zinc-900 dark:text-zinc-100">
            <strong>{totalRows.toLocaleString('it-IT')}</strong> righe trovate ·{' '}
            <strong>{previewCount}</strong> in anteprima ·{' '}
            <strong>{usedLLM ? 'mappatura AI' : 'mappatura automatica'}</strong>
          </p>
          <p className="text-xs text-zinc-500">
            Controlla che ogni colonna sia abbinata al campo giusto. Le righe non valide saranno scartate al momento della conferma.
          </p>
        </div>
      </div>

      {/* Mapping editor */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide">
          Mappatura colonne
        </h2>
        <div className="rounded-lg border border-zinc-500/20 bg-white dark:bg-zinc-900 divide-y divide-zinc-500/10">
          {mappings.map((m) => (
            <MappingRow
              key={m.sourceColumn}
              mapping={m}
              sampleValues={sample
                .filter((s) => s.ok)
                .slice(0, 3)
                .map((s) => (s.ok ? formatSampleForColumn(m.sourceColumn, m.destField, s.row) : ''))}
              showConfidence={usedLLM}
              onChange={(dest) => updateMapping(m.sourceColumn, dest)}
            />
          ))}
        </div>
      </section>

      {/* Preview table */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide">
          Anteprima righe trasformate
        </h2>
        <PreviewTable sample={sample} sourceHeaders={sampleHeaders} />
      </section>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleCancel}
          className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100"
        >
          <X className="size-4" /> Annulla
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleConfirm}
          className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg bg-primary text-white disabled:opacity-40 enabled:hover:bg-primary-hover"
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          {isSubmitting ? 'Avvio...' : `Conferma e importa ${totalRows.toLocaleString('it-IT')} righe`}
        </button>
      </div>
    </div>
  );
}

function MappingRow({
  mapping,
  sampleValues,
  showConfidence,
  onChange,
}: {
  mapping: ColumnMapping;
  sampleValues: string[];
  showConfidence: boolean;
  onChange: (dest: ClientDestField | null) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{mapping.sourceColumn}</span>
        {sampleValues.filter(Boolean).length > 0 && (
          <span className="text-xs text-zinc-400 truncate">
            es: {sampleValues.filter(Boolean).slice(0, 3).join(' · ')}
          </span>
        )}
      </div>
      <ArrowRight className="size-4 text-zinc-300" />
      <div className="flex items-center gap-2">
        <select
          value={mapping.destField ?? ''}
          onChange={(e) => onChange(e.target.value ? (e.target.value as ClientDestField) : null)}
          className="flex-1 px-3 py-1.5 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
        >
          <option value="">Ignora</option>
          {ALL_CLIENT_DEST_FIELDS.map((f) => (
            <option key={f} value={f}>{DEST_FIELD_LABELS[f]}</option>
          ))}
        </select>
        {showConfidence && mapping.destField && (
          <ConfidencePill confidence={mapping.confidence} />
        )}
      </div>
    </div>
  );
}

function ConfidencePill({ confidence }: { confidence: number }) {
  const label = confidence >= 0.8 ? 'Alta' : confidence >= 0.6 ? 'Media' : 'Bassa';
  const tone =
    confidence >= 0.8
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      : confidence >= 0.6
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${tone}`} title={`Confidence: ${(confidence * 100).toFixed(0)}%`}>
      {label}
    </span>
  );
}

function PreviewTable({
  sample,
  sourceHeaders,
}: {
  sample: ImportJob['preview_json'] extends infer T ? T extends { sample: infer S } ? S : never : never;
  sourceHeaders: string[];
}) {
  if (!sample || sample.length === 0) {
    return <p className="text-sm text-zinc-500 italic">Nessuna riga disponibile per l&apos;anteprima.</p>;
  }
  const cols: { key: keyof typeof DEST_FIELD_LABELS | 'phonePrefix' | 'phoneNumber'; label: string }[] = [
    { key: 'firstName', label: 'Nome' },
    { key: 'lastName', label: 'Cognome' },
    { key: 'email', label: 'Email' },
    { key: 'phonePrefix', label: 'Prefisso' },
    { key: 'phoneNumber', label: 'Telefono' },
    { key: 'gender', label: 'Sesso' },
    { key: 'birthDate', label: 'Nascita' },
    { key: 'note', label: 'Note' },
  ];
  return (
    <div className="rounded-lg border border-zinc-500/20 bg-white dark:bg-zinc-900 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-800/50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">#</th>
            {cols.map((c) => (
              <th key={c.key} className="px-3 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-500/10">
          {sample.map((s, i) => (
            <tr key={i} className={!s.ok ? 'bg-rose-50/50 dark:bg-rose-900/10' : undefined}>
              <td className="px-3 py-2 text-xs text-zinc-400 font-mono">{i + 1}</td>
              {!s.ok ? (
                <td colSpan={cols.length} className="px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
                  ✗ {s.reason}
                </td>
              ) : (
                cols.map((c) => (
                  <td key={c.key} className="px-3 py-2 text-zinc-700 dark:text-zinc-300 max-w-[200px] truncate">
                    {String(s.row[c.key as keyof typeof s.row] ?? '') || <span className="text-zinc-400">—</span>}
                  </td>
                ))
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {sourceHeaders.length === 0 && null /* keep types happy */}
    </div>
  );
}

function CommittingPanel({ job }: { job: ImportJob }) {
  const total = job.total_rows ?? 0;
  const done = job.processed_rows;
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <div className="flex flex-col gap-4 p-6 rounded-lg border border-zinc-500/20 bg-zinc-50 dark:bg-zinc-800">
      <div className="flex items-center gap-3">
        <Loader2 className="size-5 animate-spin text-primary" />
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Importazione in corso</h2>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-zinc-700 dark:text-zinc-200 font-medium">
            {done.toLocaleString('it-IT')} / {total.toLocaleString('it-IT')} righe
          </span>
          <span className="text-zinc-500">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {(job.skipped_rows > 0 || job.failed_rows > 0) && (
        <p className="text-xs text-zinc-500">
          {job.skipped_rows.toLocaleString('it-IT')} duplicati saltati ·{' '}
          {job.failed_rows.toLocaleString('it-IT')} righe non valide
        </p>
      )}
    </div>
  );
}

function CompletedPanel({ job, onReturn }: { job: ImportJob; onReturn: () => void }) {
  const isFull = job.status === 'completed';
  const Icon = isFull ? CheckCircle2 : AlertTriangle;
  const tone = isFull ? 'text-emerald-600' : 'text-amber-600';
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
    <div className="flex flex-col items-center gap-4 p-8 rounded-lg border border-zinc-500/20 bg-zinc-50 dark:bg-zinc-800 text-center">
      <Icon className={`size-12 ${tone}`} />
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {isFull ? 'Importazione completata' : 'Importazione completata (con errori)'}
      </h2>
      <div className="grid grid-cols-3 gap-6 text-sm">
        <Stat label="Importati" value={job.processed_rows} tone="emerald" />
        <Stat label="Duplicati saltati" value={job.skipped_rows} tone="zinc" />
        <Stat label="Errori" value={job.failed_rows} tone={job.failed_rows > 0 ? 'rose' : 'zinc'} />
      </div>
      <div className="flex items-center gap-3 pt-2">
        {errors.length > 0 && (
          <button
            type="button"
            onClick={downloadErrors}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600"
          >
            <FileWarning className="size-4" /> Scarica report errori
          </button>
        )}
        <button
          type="button"
          onClick={onReturn}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover"
        >
          Vai ai clienti <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

function ConciergePanel({ reason }: { reason: string | null }) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-900/20 text-center">
      <Mail className="size-12 text-amber-600" />
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Affidato al team Lume
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-300 max-w-md">
        {reason ?? 'Il tuo file richiede un\'elaborazione manuale. Ti scriviamo entro 24 ore.'}
      </p>
    </div>
  );
}

function ErrorPanel({ title, message, onBack }: { title: string; message: string; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 rounded-lg border border-rose-500/30 bg-rose-50 dark:bg-rose-900/20 text-center">
      <AlertTriangle className="size-10 text-rose-600" />
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{message}</p>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600"
      >
        <ArrowLeft className="size-4" /> Torna indietro
      </button>
    </div>
  );
}

function CenteredSpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24">
      <Loader2 className="size-6 animate-spin text-primary" />
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'emerald' | 'rose' | 'zinc' }) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    rose: 'text-rose-600 dark:text-rose-400',
    zinc: 'text-zinc-700 dark:text-zinc-200',
  };
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-2xl font-semibold ${colors[tone]}`}>{value.toLocaleString('it-IT')}</span>
      <span className="text-xs text-zinc-500 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function escapeCsv(v: unknown): string {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatSampleForColumn(
  _column: string,
  _destField: ClientDestField | null,
  row: Extract<ImportJob['preview_json'] extends infer T ? T extends { sample: (infer S)[] } ? S : never : never, { ok: true }>['row'],
): string {
  // Walk the transformed row and pick a non-empty plausibly-relevant value.
  // Useful as a hint of "what the LLM thought belongs in this column".
  const fields = ['firstName', 'lastName', 'email', 'phoneNumber', 'birthDate', 'note'] as const;
  for (const f of fields) {
    const v = row[f];
    if (v) return String(v);
  }
  return '';
}
