'use client';

import { useEffect, useMemo, useState } from 'react';
import { Ban, Calendar as CalendarIcon, FileText, Trash } from 'lucide-react';
import { useOperatorUnavailabilitiesStore } from '@/lib/stores/operatorUnavailabilities';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import { Switch } from '@/lib/components/shared/ui/Switch';
import type { Operator } from '@/lib/types/Operator';
import type { OperatorUnavailability } from '@/lib/types/OperatorUnavailability';

interface UnavailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The operator the block is for. Required when creating. */
  operator: Operator | null;
  /** Pre-fill from a click-and-drag gesture (single day, partial-time). */
  prefill?: { start: Date; end: Date } | null;
  /** When set, switch to "edit" mode for an existing block. */
  editing?: OperatorUnavailability | null;
}

const labelClass = 'flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300';
const inputClass =
  'w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary/40';

function toDateInputValue(d: Date): string {
  // YYYY-MM-DD in local time.
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toTimeInputValue(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function combine(dateStr: string, timeStr: string): Date {
  const [yyyy, mm, dd] = dateStr.split('-').map(Number);
  const [hh, mi] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setFullYear(yyyy, mm - 1, dd);
  d.setHours(hh, mi, 0, 0);
  return d;
}

export function UnavailabilityModal({
  isOpen,
  onClose,
  operator,
  prefill,
  editing,
}: UnavailabilityModalProps) {
  const add = useOperatorUnavailabilitiesStore((s) => s.add);
  const update = useOperatorUnavailabilitiesStore((s) => s.update);
  const remove = useOperatorUnavailabilitiesStore((s) => s.remove);

  const [allDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('18:00');
  const [note, setNote] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Initialize state from props each time the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage('');
    setIsSubmitting(false);
    setConfirmDelete(false);

    if (editing) {
      setAllDay(editing.all_day);
      setStartDate(toDateInputValue(editing.start_at));
      setStartTime(toTimeInputValue(editing.start_at));
      setEndDate(toDateInputValue(editing.end_at));
      setEndTime(toTimeInputValue(editing.end_at));
      setNote(editing.note ?? '');
    } else if (prefill) {
      setAllDay(false);
      setStartDate(toDateInputValue(prefill.start));
      setStartTime(toTimeInputValue(prefill.start));
      setEndDate(toDateInputValue(prefill.end));
      setEndTime(toTimeInputValue(prefill.end));
      setNote('');
    } else {
      // Multi-day "Aggiungi ferie" entry from operator chip menu.
      const today = new Date();
      setAllDay(true);
      setStartDate(toDateInputValue(today));
      setStartTime('09:00');
      setEndDate(toDateInputValue(today));
      setEndTime('18:00');
      setNote('');
    }
  }, [isOpen, editing, prefill]);

  const isEdit = !!editing;
  const operatorName = editing?.getOperator()?.getFullName() ?? operator?.getFullName() ?? '';

  const computed = useMemo(() => {
    if (!startDate || !endDate) return null;
    let start: Date;
    let end: Date;
    if (allDay) {
      start = combine(startDate, '00:00');
      end = combine(endDate, '23:59');
    } else {
      start = combine(startDate, startTime);
      end = combine(endDate, endTime);
    }
    return { start, end };
  }, [allDay, startDate, startTime, endDate, endTime]);

  function validate(): string | null {
    if (!operator && !editing) return 'Operatore mancante';
    if (!computed) return 'Date non valide';
    if (computed.end <= computed.start) return 'La fine deve essere successiva all\'inizio';
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) {
      setErrorMessage(err);
      return;
    }
    if (!computed) return;

    setIsSubmitting(true);
    try {
      if (isEdit && editing) {
        await update(editing.id, {
          start_at: computed.start,
          end_at: computed.end,
          all_day: allDay,
          note: note.trim() || null,
        });
        messagePopup.getState().success('Non disponibilità aggiornata');
      } else if (operator) {
        await add({
          operator_id: operator.id,
          start_at: computed.start,
          end_at: computed.end,
          all_day: allDay,
          note: note.trim() || null,
        });
        messagePopup.getState().success('Non disponibilità creata');
      }
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore imprevisto';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    setIsSubmitting(true);
    try {
      await remove(editing.id);
      messagePopup.getState().success('Non disponibilità eliminata');
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore imprevisto';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <AddModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleSubmit}
        title={isEdit ? 'Modifica non disponibilità' : 'Nuova non disponibilità'}
        subtitle={operatorName ? `Per ${operatorName}` : 'Blocca tempo nel calendario'}
        icon={Ban}
        confirmText={isEdit ? 'Salva' : 'Crea'}
        confirmDisabled={isSubmitting}
        classes="max-w-md"
        contentClasses="overflow-y-auto"
        dangerAction={
          isEdit ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
            >
              <Trash className="size-4" />
              Elimina
            </button>
          ) : null
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Tutto il giorno
            </span>
            <Switch checked={allDay} onChange={() => setAllDay((v) => !v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                <CalendarIcon className="size-3.5" />
                Inizio
              </label>
              <input
                type="date"
                className={inputClass}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Ora</label>
              <input
                type="time"
                className={`${inputClass} ${allDay ? 'opacity-40 pointer-events-none' : ''}`}
                value={startTime}
                disabled={allDay}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                <CalendarIcon className="size-3.5" />
                Fine
              </label>
              <input
                type="date"
                className={inputClass}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Ora</label>
              <input
                type="time"
                className={`${inputClass} ${allDay ? 'opacity-40 pointer-events-none' : ''}`}
                value={endTime}
                disabled={allDay}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <FileText className="size-3.5" />
              Nota (opzionale)
            </label>
            <input
              type="text"
              className={inputClass}
              value={note}
              maxLength={200}
              placeholder="Es. Visita medica, Ferie estive"
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {errorMessage && (
            <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
          )}
        </div>
      </AddModal>

      <DeleteModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Elimina non disponibilità"
        subtitle="Questa azione è irreversibile."
      />
    </>
  );
}
