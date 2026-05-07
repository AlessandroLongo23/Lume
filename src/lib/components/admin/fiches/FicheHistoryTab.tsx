'use client';

import { useMemo } from 'react';
import { History, User as UserIcon } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { useFicheEditsStore } from '@/lib/stores/fiche_edits';
import { useOperatorsStore } from '@/lib/stores/operators';
import { formatCurrency } from '@/lib/utils/format';
import type { FicheEdit, FicheEditChanges } from '@/lib/types/FicheEdit';

const FIELD_LABELS: Record<string, string> = {
  datetime: 'Data e ora',
  client_id: 'Cliente',
  note: 'Note',
  status: 'Stato',
  total_override: 'Totale',
  miscela: 'Miscela',
  tecnica: 'Tecnica',
  paid: 'Pagata',
  payment_added: 'Pagamento aggiunto',
};

const STATUS_LABELS: Record<string, string> = {
  created: 'Prenotata',
  pending: 'In attesa',
  completed: 'Conclusa',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Contanti',
  pos: 'POS',
  other: 'Altro',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function formatPaymentAdded(value: unknown): string {
  if (!isRecord(value)) return '—';
  const method = typeof value.method === 'string' ? value.method : '';
  const amount = typeof value.amount === 'number' ? value.amount : Number(value.amount);
  const methodLabel = PAYMENT_METHOD_LABELS[method] ?? (method || '—');
  if (Number.isFinite(amount)) {
    return `${methodLabel} · ${formatCurrency(amount)}`;
  }
  return methodLabel;
}

interface FicheHistoryTabProps {
  ficheId: string;
}

function formatValue(field: string, value: unknown): string {
  // payment_added carries an object payload ({method, amount, …}); render it
  // before the null-guard so an explicit `null` for `old` still becomes `—`.
  if (field === 'payment_added') {
    if (value === null || value === undefined) return '—';
    return formatPaymentAdded(value);
  }

  if (value === null || value === undefined || value === '') return '—';

  if (field === 'total_override') {
    const n = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(n)) return '—';
    return formatCurrency(n);
  }

  if (field === 'datetime') {
    try {
      const d = typeof value === 'string' || value instanceof Date ? new Date(value as string | Date) : null;
      if (!d || Number.isNaN(d.getTime())) return '—';
      return format(d, 'd MMM yyyy HH:mm', { locale: it });
    } catch {
      return '—';
    }
  }

  if (field === 'status' && typeof value === 'string') {
    return STATUS_LABELS[value] ?? value;
  }

  if (field === 'paid') {
    return value ? 'Sì' : 'No';
  }

  // Text fields → wrap in quotes (note, miscela, tecnica)
  if (field === 'note' || field === 'miscela' || field === 'tecnica') {
    const s = String(value);
    return `"${s}"`;
  }

  // client_id: raw uuid for now (TODO v2: resolve client name from clients store)
  return String(value);
}

function ChangeBullet({ field, change }: { field: string; change: { old: unknown; new: unknown } }) {
  const label = FIELD_LABELS[field] ?? field;
  // Returns a <div> (not a <li>) because the parent already wraps each entry
  // in a <li>; nesting <li>s here would produce invalid HTML and a React 19
  // warning.
  return (
    <div className="text-xs text-zinc-600 dark:text-zinc-300">
      <span className="font-medium text-zinc-700 dark:text-zinc-200">{label}</span>
      <span className="text-zinc-500 dark:text-zinc-400">: </span>
      <span className="text-zinc-500 dark:text-zinc-400 line-through">{formatValue(field, change.old)}</span>
      <span className="mx-1.5 text-zinc-400">→</span>
      <span className="text-zinc-700 dark:text-zinc-200">{formatValue(field, change.new)}</span>
    </div>
  );
}

function EditRow({ edit }: { edit: FicheEdit }) {
  const operators = useOperatorsStore((s) => s.operators);

  const editorName = useMemo(() => {
    if (!edit.edited_by) return 'Utente rimosso';
    const op = operators.find((o) => o.user_id === edit.edited_by);
    return op?.getFullName() ?? '—';
  }, [edit.edited_by, operators]);

  const initials = useMemo(() => {
    if (editorName === 'Utente rimosso' || editorName === '—') return '?';
    const parts = editorName.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase() || '?';
  }, [editorName]);

  const relativeTime = useMemo(() => {
    try {
      return formatDistanceToNow(edit.edited_at, { locale: it, addSuffix: true });
    } catch {
      return '';
    }
  }, [edit.edited_at]);

  const changeEntries = Object.entries(edit.changes ?? ({} as FicheEditChanges));

  return (
    <li className="flex gap-3 py-3">
      <div
        aria-hidden
        className="shrink-0 size-9 rounded-full flex items-center justify-center text-xs font-semibold bg-primary/10 text-primary-hover dark:text-primary/70"
      >
        {initials === '?' ? <UserIcon className="size-4 opacity-60" /> : initials}
      </div>
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {editorName}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            ha modificato la fiche
          </span>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{relativeTime}</span>
          {edit.reason && edit.reason.trim() && (
            <>
              <span aria-hidden>·</span>
              <span className="italic text-zinc-600 dark:text-zinc-300">&ldquo;{edit.reason.trim()}&rdquo;</span>
            </>
          )}
        </div>
        {changeEntries.length > 0 && (
          <ul className="mt-1 flex flex-col gap-1 list-none pl-0">
            {changeEntries.map(([field, change]) => (
              <li key={field} className="flex items-start gap-1.5">
                <span aria-hidden className="text-zinc-400 mt-1.5 leading-none">•</span>
                <ChangeBullet field={field} change={change} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

export function FicheHistoryTab({ ficheId }: FicheHistoryTabProps) {
  // Subscribe to the underlying array so the list re-renders on realtime updates
  // (selecting only `getByFicheId` would not trigger because Zustand's default
  // equality check sees a reference-stable function).
  const allEdits = useFicheEditsStore((s) => s.fiche_edits);
  const edits = useMemo(
    () =>
      allEdits
        .filter((e) => e.fiche_id === ficheId)
        .sort((a, b) => b.edited_at.getTime() - a.edited_at.getTime()),
    [allEdits, ficheId],
  );

  if (edits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-zinc-400">
        <History className="size-10 opacity-30" />
        <p className="text-sm">Nessuna modifica registrata.</p>
        <TrackedFieldsLegend />
      </div>
    );
  }

  return (
    <div className="overflow-y-auto min-h-0 flex-1 flex flex-col">
      <ul className="flex flex-col divide-y divide-zinc-500/10 list-none pl-0">
        {edits.map((e) => (
          <EditRow key={e.id} edit={e} />
        ))}
      </ul>
      <div className="mt-auto pt-3 border-t border-zinc-500/10">
        <TrackedFieldsLegend />
      </div>
    </div>
  );
}

function TrackedFieldsLegend() {
  // Sets expectations about scope: line-item churn (singolo servizio o
  // prodotto aggiunto/rimosso) is intentionally not tracked here in v1.
  return (
    <p className="text-2xs text-zinc-400 dark:text-zinc-500 px-3 py-2 leading-relaxed">
      La cronologia traccia modifiche a data, cliente, note, miscela, tecnica,
      totale, stato della fiche e pagamenti. Le modifiche ai singoli servizi
      o prodotti non sono ancora tracciate.
    </p>
  );
}
