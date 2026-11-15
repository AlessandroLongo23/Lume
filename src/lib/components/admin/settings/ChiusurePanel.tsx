'use client';

import { useMemo, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { SettingsCard } from './SettingsCard';
import { Button } from '@/lib/components/shared/ui/Button';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { DateField } from '@/lib/components/shared/ui/forms/DateField';
import { ConfirmDialog } from '@/lib/components/shared/ui/modals/ConfirmDialog';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useSalonClosuresStore, type SalonClosure } from '@/lib/stores/salonClosures';

// Sub-project C: closures CRUD. v1 supports concrete date ranges only —
// recurring closures (every Sunday, every August) sit in the v2 backlog.
//
// Two responsibilities:
//   1. Form to add a new closure (starts_on + ends_on, optional note).
//   2. List of upcoming + ongoing closures with inline delete.
//
// Past closures stay in the DB (we don't auto-purge) but they're hidden
// here to keep the panel quiet. The slot oracle ignores them anyway.

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatRange(starts_on: string, ends_on: string): string {
  const a = parseISO(starts_on);
  const b = parseISO(ends_on);
  const sameDay = starts_on === ends_on;
  if (sameDay) return format(a, 'EEEE d MMMM yyyy', { locale: it });
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  const sameYear = a.getFullYear() === b.getFullYear();
  if (sameMonth) {
    return `${format(a, 'd', { locale: it })}–${format(b, "d MMMM yyyy", { locale: it })}`;
  }
  if (sameYear) {
    return `${format(a, 'd MMMM', { locale: it })} – ${format(b, 'd MMMM yyyy', { locale: it })}`;
  }
  return `${format(a, 'd MMM yyyy', { locale: it })} – ${format(b, 'd MMM yyyy', { locale: it })}`;
}

export function ChiusurePanel() {
  const items = useSalonClosuresStore((s) => s.items);
  const isLoading = useSalonClosuresStore((s) => s.isLoading);
  const addClosure = useSalonClosuresStore((s) => s.addClosure);
  const removeClosure = useSalonClosuresStore((s) => s.removeClosure);

  const [startsOn, setStartsOn] = useState('');
  const [endsOn, setEndsOn] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SalonClosure | null>(null);

  // Hide past closures from the list — they're not actionable. Anything that
  // ends today-or-later is "current/upcoming".
  const upcoming = useMemo(() => {
    const today = todayISO();
    return items.filter((c) => c.ends_on >= today);
  }, [items]);

  const canSubmit =
    !!startsOn &&
    !!endsOn &&
    endsOn >= startsOn &&
    !saving;

  async function handleAdd() {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await addClosure({ starts_on: startsOn, ends_on: endsOn, note: note.trim() || null });
      setStartsOn('');
      setEndsOn('');
      setNote('');
      messagePopup.getState().success('Chiusura aggiunta.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore durante il salvataggio.';
      messagePopup.getState().error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await removeClosure(pendingDelete.id);
      messagePopup.getState().success('Chiusura rimossa.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore durante l'eliminazione.";
      messagePopup.getState().error(msg);
    } finally {
      setPendingDelete(null);
    }
  }

  // Wrapped so the section is the first child and draws no hairline under the page title.
  return (
    <div>
      <SettingsCard
        title="Chiusure programmate"
        description="Date in cui il salone è chiuso. Si applicano anche alla vetrina pubblica."
        rightSlot={
          <span className="text-xs text-[var(--lume-text-secondary)] tabular-nums">
            {upcoming.length} {upcoming.length === 1 ? 'attiva' : 'attive'}
          </span>
        }
      >
        <div className="flex flex-col gap-6">
          {/* Add form */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Dal">
                {({ id }) => (
                  <DateField
                    id={id}
                    value={startsOn}
                    min={todayISO()}
                    onChange={(v) => {
                      setStartsOn(v);
                      // Keep ends_on >= starts_on so the form is always valid.
                      if (v && endsOn && endsOn < v) setEndsOn(v);
                    }}
                  />
                )}
              </Field>
              <Field label="Al">
                {({ id }) => (
                  <DateField id={id} value={endsOn} min={startsOn || todayISO()} onChange={setEndsOn} />
                )}
              </Field>
            </div>
            <FormInput
              fieldClassName="mt-3"
              label="Nota (facoltativa)"
              placeholder="Es. ferie d'agosto, formazione, lavori"
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="mt-4 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                leadingIcon={Plus}
                onClick={handleAdd}
                disabled={!canSubmit}
              >
                {saving ? 'Salvo…' : 'Aggiungi chiusura'}
              </Button>
            </div>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="size-4 animate-spin text-[var(--lume-text-muted)]" />
            </div>
          ) : upcoming.length === 0 ? (
            <p className="text-sm text-[var(--lume-text-secondary)]">
              Nessuna chiusura programmata. Aggiungi la prima quando ti serve.
            </p>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {upcoming.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--lume-text)]">
                      {formatRange(c.starts_on, c.ends_on)}
                    </p>
                    {c.note && (
                      <p className="mt-0.5 text-xs text-[var(--lume-text-secondary)] truncate">{c.note}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost-destructive"
                    size="sm"
                    iconOnly
                    aria-label="Elimina chiusura"
                    onClick={() => setPendingDelete(c)}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ConfirmDialog
          isOpen={pendingDelete !== null}
          onClose={() => setPendingDelete(null)}
          onConfirm={handleDelete}
          title="Eliminare questa chiusura?"
          description={
            pendingDelete
              ? `${formatRange(pendingDelete.starts_on, pendingDelete.ends_on)}${
                  pendingDelete.note ? ` · ${pendingDelete.note}` : ''
                }`
              : ''
          }
          confirmLabel="Elimina"
          tone="destructive"
        />
      </SettingsCard>
    </div>
  );
}
