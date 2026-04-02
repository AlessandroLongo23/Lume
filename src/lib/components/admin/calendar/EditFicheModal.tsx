'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Scissors, User, Clock, Euro, Trash2, FileText, Calendar, Check, AlertTriangle } from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import { it } from 'date-fns/locale';
import { useFichesStore } from '@/lib/stores/fiches';
import { useClientsStore } from '@/lib/stores/clients';
import { useOperatorsStore } from '@/lib/stores/operators';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { useFicheServicesStore } from '@/lib/stores/fiche_services';
import { FicheStatus } from '@/lib/types/ficheStatus';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { validateFicheConflicts } from '@/lib/actions/fiches';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';
import type { Fiche } from '@/lib/types/Fiche';
import type { Service } from '@/lib/types/Service';

interface FicheServiceState {
  id?: string;
  service_id: string;
  name: string;
  operator_id: string;
  duration: number;
  price: number;
}

interface EditFicheModalProps {
  isOpen: boolean;
  onClose: () => void;
  fiche: Fiche | null;
}

function toDatetimeLocal(date: Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const TABLE_COLS = '1fr 1.5fr 80px 60px 60px 76px 32px';

export function EditFicheModal({ isOpen, onClose, fiche }: EditFicheModalProps) {
  const updateFiche = useFichesStore((s) => s.updateFiche);
  const deleteFiche = useFichesStore((s) => s.deleteFiche);
  const clients = useClientsStore((s) => s.clients);
  const operators = useOperatorsStore((s) => s.operators);
  const services = useServicesStore((s) => s.services);
  const serviceCategories = useServiceCategoriesStore((s) => s.service_categories);
  const { addFicheService, updateFicheService, deleteFicheService } = useFicheServicesStore();

  const [clientId, setClientId] = useState('');
  const [datetimeStr, setDatetimeStr] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<FicheStatus>(FicheStatus.CREATED);
  const [ficheServices, setFicheServices] = useState<FicheServiceState[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [svcQuery, setSvcQuery] = useState('');
  const [svcOpen, setSvcOpen] = useState(false);

  const svcInputRef = useRef<HTMLInputElement>(null);
  const svcDropdownRef = useRef<HTMLDivElement>(null);

  // Pre-populate from fiche when modal opens
  useEffect(() => {
    if (isOpen && fiche) {
      setClientId(fiche.client_id);
      setDatetimeStr(toDatetimeLocal(new Date(fiche.datetime)));
      setNote(fiche.note ?? '');
      setStatus(fiche.status);
      const existingServices = fiche.getFicheServices();
      setFicheServices(
        existingServices.map((fs) => {
          const svc = services.find((s) => s.id === fs.service_id);
          return {
            id: fs.id,
            service_id: fs.service_id,
            name: svc?.name ?? 'Servizio',
            operator_id: fs.operator_id ?? '',
            duration: fs.duration,
            price: svc?.price ?? 0,
          };
        }),
      );
      setErrors({});
      setErrorMessage('');
      setSvcQuery('');
      setSvcOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, fiche]);

  // Close service dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (svcDropdownRef.current && !svcDropdownRef.current.contains(e.target as Node)) {
        setSvcOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const baseTime = useMemo(() => {
    if (!datetimeStr) return new Date();
    const d = new Date(datetimeStr);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [datetimeStr]);

  const servicesWithTimes = useMemo(() => {
    let cursor = baseTime;
    return ficheServices.map((s) => {
      const start_time = cursor;
      const end_time = addMinutes(cursor, s.duration);
      cursor = end_time;
      return { ...s, start_time, end_time };
    });
  }, [ficheServices, baseTime]);

  const totalDuration = useMemo(() => ficheServices.reduce((acc, s) => acc + s.duration, 0), [ficheServices]);
  const totalPrice = useMemo(() => ficheServices.reduce((acc, s) => acc + s.price, 0), [ficheServices]);

  const selectedClient = useMemo(() => clients.find((c) => c.id === clientId) ?? null, [clients, clientId]);
  const lastNote = useMemo(() => selectedClient?.getLastNote() ?? '', [selectedClient]);

  const clientOptions = clients.map((c) => ({ ...c, fullName: c.getFullName() }));
  const operatorOptions = operators.filter((op) => !op.isArchived).map((op) => ({ ...op, fullName: op.getFullName() }));

  const groupedServices = useMemo(() => {
    const q = svcQuery.toLowerCase().trim();
    const filtered = q ? services.filter((s) => s.name.toLowerCase().includes(q)) : services;
    const groups = new Map<string, { categoryName: string; items: Service[] }>();
    for (const svc of filtered) {
      const cat = serviceCategories.find((c) => c.id === svc.category_id);
      const catName = cat?.name ?? 'Altro';
      if (!groups.has(svc.category_id)) groups.set(svc.category_id, { categoryName: catName, items: [] });
      groups.get(svc.category_id)!.items.push(svc);
    }
    return Array.from(groups.values());
  }, [services, serviceCategories, svcQuery]);

  function addServiceToList(svc: Service) {
    setFicheServices((prev) => [
      ...prev,
      { service_id: svc.id, name: svc.name, operator_id: '', duration: svc.duration, price: svc.price },
    ]);
    setSvcQuery('');
    setSvcOpen(false);
  }

  function removeService(index: number) {
    setFicheServices((prev) => prev.filter((_, i) => i !== index));
  }

  function updateServiceOperator(index: number, operatorId: string) {
    setFicheServices((prev) => prev.map((s, i) => (i === index ? { ...s, operator_id: operatorId } : s)));
  }

  function updateServiceDuration(index: number, raw: number) {
    const duration = Math.max(5, raw || 5);
    setFicheServices((prev) => prev.map((s, i) => (i === index ? { ...s, duration } : s)));
  }

  async function handleDelete() {
    if (!fiche) return;
    try {
      await deleteFiche(fiche.id);
      setShowDeleteConfirm(false);
      onClose();
      messagePopup.getState().success('Fiche eliminata con successo.');
    } catch {
      messagePopup.getState().error("Errore durante l'eliminazione.");
    }
  }

  async function handleSubmit() {
    if (!fiche) return;
    const newErrors: Record<string, string> = {};
    if (!clientId) newErrors.client_id = 'Seleziona un cliente';
    if (!datetimeStr) newErrors.datetime = 'Inserisci data e ora';
    if (!ficheServices.length) newErrors.services = 'Aggiungi almeno un servizio';
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    try {
      const validation = await validateFicheConflicts(
        clientId,
        servicesWithTimes.map((svc) => ({
          operator_id: svc.operator_id,
          operator_name: operators.find((op) => op.id === svc.operator_id)?.getFullName() ?? svc.operator_id,
          start_time: svc.start_time.toISOString(),
          end_time: svc.end_time.toISOString(),
        })),
        fiche.id,
      );
      if (validation.error) {
        messagePopup.getState().error(validation.error);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateFiche(fiche.id, { client_id: clientId, datetime: baseTime as any, status, note });

      // IDs currently in the local list (existing services only)
      const currentIds = new Set(ficheServices.filter((s) => s.id).map((s) => s.id!));

      // Delete services that were removed
      for (const fs of fiche.getFicheServices()) {
        if (!currentIds.has(fs.id)) {
          await deleteFicheService(fs.id);
        }
      }

      // Update existing or insert new services
      for (const svc of servicesWithTimes) {
        if (svc.id) {
          await updateFicheService(svc.id, {
            operator_id: svc.operator_id || undefined,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            start_time: svc.start_time as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            end_time: svc.end_time as any,
            duration: svc.duration,
          });
        } else {
          await addFicheService({
            fiche_id: fiche.id,
            service_id: svc.service_id,
            operator_id: svc.operator_id || undefined,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            start_time: svc.start_time as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            end_time: svc.end_time as any,
            duration: svc.duration,
          });
        }
      }

      onClose();
      messagePopup.getState().success('Appuntamento aggiornato con successo');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Si è verificato un errore sconosciuto');
    }
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-shadow';
  const labelClass =
    'flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide';

  return (
    <>
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Modifica fiche"
      subtitle="Aggiorna i dettagli dell'appuntamento"
      classes="max-w-6xl h-[90vh]"
      confirmText="Salva"
      footerContent={
        <div className="flex flex-col gap-0.5">
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Preventivo: € {totalPrice.toFixed(2)}
          </span>
          <span className="text-xs text-zinc-500">Durata: {totalDuration} min</span>
        </div>
      }
      dangerAction={
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="size-4" />
          Elimina
        </button>
      }
    >
      <div className="grid gap-8 h-full" style={{ gridTemplateColumns: '2fr 3fr' }}>

        {/* ══ LEFT COLUMN ══════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-5">

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}><Calendar className="size-3.5" />Data e ora *</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={datetimeStr}
              onChange={(e) => setDatetimeStr(e.target.value)}
            />
            {errors.datetime && <p className="mt-0.5 text-xs text-red-500">{errors.datetime}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}><User className="size-3.5" />Cliente *</label>
            <CustomSelect
              options={clientOptions}
              labelKey="fullName"
              valueKey="id"
              value={clientId}
              onChange={setClientId}
              placeholder="Cerca cliente…"
              maxHeight="max-h-48"
            />
            {errors.client_id && <p className="mt-0.5 text-xs text-red-500">{errors.client_id}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}><FileText className="size-3.5" />Ultima nota tecnica</label>
            <textarea
              className={`${inputClass} resize-none bg-zinc-50 dark:bg-zinc-700/30 text-zinc-500 dark:text-zinc-400 cursor-default`}
              rows={3}
              value={lastNote}
              readOnly
              placeholder={selectedClient ? 'Nessuna nota precedente' : 'Seleziona un cliente…'}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}><FileText className="size-3.5" />Nota appuntamento</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note per questo appuntamento…"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}><Check className="size-3.5" />Stato</label>
            <select
              className={inputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as FicheStatus)}
            >
              <option value={FicheStatus.CREATED}>Creata</option>
              <option value={FicheStatus.PENDING}>In attesa</option>
              <option value={FicheStatus.COMPLETED}>Completata</option>
            </select>
          </div>

        </div>

        {/* ══ RIGHT COLUMN ═════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-4 min-h-0">

          <label className={labelClass}><Scissors className="size-3.5" />Servizi</label>

          {/* Grouped service combobox */}
          <div ref={svcDropdownRef} className="relative -mt-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
              <input
                ref={svcInputRef}
                type="text"
                className={`${inputClass} pl-8`}
                placeholder="Cerca e aggiungi servizi…"
                value={svcQuery}
                onChange={(e) => { setSvcQuery(e.target.value); setSvcOpen(true); }}
                onFocus={() => setSvcOpen(true)}
              />
            </div>

            {svcOpen && (
              <div className="absolute w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-500/25 rounded-lg shadow-xl z-100 overflow-hidden">
                {groupedServices.length === 0 ? (
                  <p className="p-4 text-sm text-center text-zinc-500">Nessun servizio trovato</p>
                ) : (
                  <div className="max-h-56 overflow-y-auto">
                    {groupedServices.map(({ categoryName, items }) => (
                      <div key={categoryName}>
                        <div className="sticky top-0 px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-50 dark:bg-zinc-700/60 border-b border-zinc-500/10">
                          {categoryName}
                        </div>
                        {items.map((svc) => (
                          <button
                            key={svc.id}
                            type="button"
                            onClick={() => addServiceToList(svc)}
                            className="w-full px-3 py-2.5 text-left flex items-center justify-between gap-2 text-sm transition-colors hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 cursor-pointer"
                          >
                            <span className="text-zinc-900 dark:text-zinc-100 truncate">{svc.name}</span>
                            <div className="flex items-center gap-2.5 text-xs text-zinc-400 shrink-0">
                              <span className="flex items-center gap-1"><Clock className="size-3" />{svc.duration} min</span>
                              <span className="flex items-center gap-1"><Euro className="size-3" />{svc.price.toFixed(2)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {errors.services && <p className="text-xs text-red-500 -mt-2">{errors.services}</p>}

          {/* Services table */}
          <div className="flex flex-col rounded-lg border border-zinc-500/25 flex-1 min-h-0">
            {ficheServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400">
                <Scissors className="size-8 opacity-20" />
                <p className="text-sm">Nessun servizio aggiunto</p>
                <p className="text-xs opacity-60">Cerca e clicca per aggiungere</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div
                  className="grid items-center px-3 py-2 bg-zinc-50 dark:bg-zinc-700/40 border-b border-zinc-500/15 text-xs font-medium text-zinc-400 uppercase tracking-wide shrink-0 rounded-t-lg"
                  style={{ gridTemplateColumns: TABLE_COLS }}
                >
                  <span className="flex items-center gap-1"><Scissors className="size-3" />Servizio</span>
                  <span className="flex items-center gap-1"><User className="size-3" />Operatore</span>
                  <span className="flex items-center gap-1 justify-center"><Clock className="size-3" />Min</span>
                  <span className="text-center">Inizio</span>
                  <span className="text-center">Fine</span>
                  <span className="flex items-center gap-1 justify-end"><Euro className="size-3" />Prezzo</span>
                  <span />
                </div>

                {/* Rows */}
                <div className="divide-y divide-zinc-500/10 overflow-y-auto overscroll-contain">
                  {servicesWithTimes.map((svc, i) => (
                    <div
                      key={svc.id ?? i}
                      className="grid items-center px-3 py-2.5 group"
                      style={{ gridTemplateColumns: TABLE_COLS }}
                    >
                      <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate pr-2">{svc.name}</span>

                      <div className="pr-2">
                        <CustomSelect
                          options={operatorOptions}
                          labelKey="fullName"
                          valueKey="id"
                          value={svc.operator_id}
                          onChange={(v) => updateServiceOperator(i, v)}
                          placeholder="—"
                          maxHeight="max-h-40"
                          classes="text-sm"
                        />
                      </div>

                      <div className="flex justify-center">
                        <input
                          type="number"
                          value={svc.duration}
                          onChange={(e) => updateServiceDuration(i, parseInt(e.target.value))}
                          min={5}
                          step={5}
                          className="w-[60px] px-2 py-1 text-center text-sm rounded-md border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
                        />
                      </div>

                      <span className="text-sm text-center font-mono text-zinc-600 dark:text-zinc-400">
                        {format(svc.start_time, 'HH:mm', { locale: it })}
                      </span>
                      <span className="text-sm text-center font-mono text-zinc-600 dark:text-zinc-400">
                        {format(svc.end_time, 'HH:mm', { locale: it })}
                      </span>
                      <span className="text-sm text-right font-medium text-zinc-700 dark:text-zinc-300">
                        € {parseFloat(String(svc.price)).toFixed(2)}
                      </span>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeService(i)}
                          className="p-1 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                          aria-label="Rimuovi servizio"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}
        </div>

      </div>
    </AddModal>

    <DeleteModal
      isOpen={showDeleteConfirm}
      onClose={() => setShowDeleteConfirm(false)}
      onConfirm={handleDelete}
      mainIcon={AlertTriangle}
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Sei sicuro di voler eliminare questa fiche? L&apos;azione è irreversibile.
      </p>
    </DeleteModal>
    </>
  );
}
