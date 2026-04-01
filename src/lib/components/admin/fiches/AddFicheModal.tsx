'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { User, Calendar, FileText, Check, X, Clock, Euro, Search, Scissors } from 'lucide-react';
import { useFichesStore } from '@/lib/stores/fiches';
import { useClientsStore } from '@/lib/stores/clients';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { useFicheServicesStore } from '@/lib/stores/fiche_services';
import type { Service } from '@/lib/types/Service';
import { FicheStatus } from '@/lib/types/ficheStatus';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';

interface AddFicheModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyFiche = () => ({ client_id: '', datetime: '', status: FicheStatus.PENDING, note: '' });

export function AddFicheModal({ isOpen, onClose }: AddFicheModalProps) {
  const addFiche = useFichesStore((s) => s.addFiche);
  const clients = useClientsStore((s) => s.clients);
  const services = useServicesStore((s) => s.services);
  const serviceCategories = useServiceCategoriesStore((s) => s.service_categories);
  const addFicheService = useFicheServicesStore((s) => s.addFicheService);

  const [fiche, setFiche] = useState(emptyFiche());
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [errors, setErrors] = useState({ client_id: '', datetime: '' });
  const [svcQuery, setSvcQuery] = useState('');
  const [svcDropdownOpen, setSvcDropdownOpen] = useState(false);

  const svcInputRef = useRef<HTMLInputElement>(null);
  const svcDropdownRef = useRef<HTMLDivElement>(null);

  const set = (key: string, value: unknown) => setFiche((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!isOpen) {
      setFiche(emptyFiche());
      setSelectedServices([]);
      setErrors({ client_id: '', datetime: '' });
      setSvcQuery('');
      setSvcDropdownOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (svcDropdownRef.current && !svcDropdownRef.current.contains(e.target as Node)) {
        setSvcDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === fiche.client_id) ?? null,
    [clients, fiche.client_id],
  );

  const lastNote = useMemo(() => selectedClient?.getLastNote() ?? '', [selectedClient]);

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

  const addService = (svc: Service) => {
    if (!selectedServices.find((s) => s.id === svc.id)) {
      setSelectedServices((prev) => [...prev, svc]);
    }
    setSvcQuery('');
    setSvcDropdownOpen(false);
    setTimeout(() => svcInputRef.current?.focus(), 50);
  };

  const removeService = (id: string) =>
    setSelectedServices((prev) => prev.filter((s) => s.id !== id));

  const totalDuration = useMemo(
    () => selectedServices.reduce((acc, s) => acc + s.duration, 0),
    [selectedServices],
  );
  const totalPrice = useMemo(
    () => selectedServices.reduce((acc, s) => acc + s.price, 0),
    [selectedServices],
  );

  const handleSubmit = async () => {
    const e = { client_id: '', datetime: '' };
    if (!fiche.client_id) e.client_id = 'Seleziona un cliente';
    if (!fiche.datetime) e.datetime = 'Inserisci data e ora';
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newFiche = await addFiche({ ...fiche, datetime: new Date(fiche.datetime) as any });
      if (selectedServices.length > 0) {
        await Promise.all(
          selectedServices.map((svc) =>
            addFicheService({ fiche_id: newFiche.id, service_id: svc.id, duration: svc.duration }),
          ),
        );
      }
      messagePopup.getState().success('Fiche aggiunta con successo');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error('Errore durante la creazione della fiche: ' + msg);
    }
  };

  const clientOptions = clients.map((c) => ({ ...c, fullName: c.getFullName() }));

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-shadow';
  const labelClass =
    'flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide';

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Nuova fiche"
      subtitle="Aggiungi un nuovo appuntamento"
      classes="max-w-5xl"
    >
      <div className="grid grid-cols-2 gap-8">
        {/* ── LEFT COLUMN ── */}
        <div className="flex flex-col gap-5">
          {/* Data e ora */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <Calendar className="size-3.5" />
              Data e ora *
            </label>
            <input
              type="datetime-local"
              className={inputClass}
              value={fiche.datetime}
              onChange={(e) => set('datetime', e.target.value)}
            />
            {errors.datetime && <p className="mt-0.5 text-xs text-red-500">{errors.datetime}</p>}
          </div>

          {/* Cliente */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <User className="size-3.5" />
              Cliente *
            </label>
            <CustomSelect
              options={clientOptions}
              labelKey="fullName"
              valueKey="id"
              value={fiche.client_id}
              onChange={(v) => set('client_id', v)}
              placeholder="Cerca cliente..."
              maxHeight="max-h-48"
            />
            {errors.client_id && <p className="mt-0.5 text-xs text-red-500">{errors.client_id}</p>}
          </div>

          {/* Ultima nota tecnica — readonly */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <FileText className="size-3.5" />
              Ultima nota tecnica
            </label>
            <textarea
              className={`${inputClass} resize-none bg-zinc-50 dark:bg-zinc-700/30 text-zinc-500 dark:text-zinc-400 cursor-default`}
              rows={3}
              value={lastNote}
              readOnly
              placeholder={selectedClient ? 'Nessuna nota precedente' : 'Seleziona un cliente…'}
            />
          </div>

          {/* Nota appuntamento */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <FileText className="size-3.5" />
              Nota appuntamento
            </label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              value={fiche.note}
              onChange={(e) => set('note', e.target.value)}
              placeholder="Note per questo appuntamento…"
            />
          </div>

          {/* Stato */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <Check className="size-3.5" />
              Stato
            </label>
            <select
              className={inputClass}
              value={fiche.status}
              onChange={(e) => set('status', e.target.value)}
            >
              <option value={FicheStatus.CREATED}>Creata</option>
              <option value={FicheStatus.PENDING}>In attesa</option>
              <option value={FicheStatus.COMPLETED}>Completata</option>
            </select>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="flex flex-col gap-5">
          {/* Grouped service combobox */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              <Scissors className="size-3.5" />
              Aggiungi servizio
            </label>
            <div ref={svcDropdownRef} className="relative">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                <input
                  ref={svcInputRef}
                  type="text"
                  className={`${inputClass} pl-8`}
                  placeholder="Cerca servizi per nome…"
                  value={svcQuery}
                  onChange={(e) => {
                    setSvcQuery(e.target.value);
                    setSvcDropdownOpen(true);
                  }}
                  onFocus={() => setSvcDropdownOpen(true)}
                />
              </div>

              {svcDropdownOpen && (
                <div className="absolute w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-500/25 rounded-lg shadow-xl z-50 overflow-hidden">
                  {groupedServices.length === 0 ? (
                    <p className="p-4 text-sm text-center text-zinc-500">Nessun servizio trovato</p>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      {groupedServices.map(({ categoryName, items }) => (
                        <div key={categoryName}>
                          <div className="sticky top-0 px-3 py-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider bg-zinc-50 dark:bg-zinc-700/60 border-b border-zinc-500/10">
                            {categoryName}
                          </div>
                          {items.map((svc) => {
                            const added = selectedServices.some((s) => s.id === svc.id);
                            return (
                              <button
                                key={svc.id}
                                type="button"
                                disabled={added}
                                onClick={() => addService(svc)}
                                className={`w-full px-3 py-2.5 text-left flex items-center justify-between gap-2 transition-colors text-sm
                                  ${added
                                    ? 'opacity-40 cursor-not-allowed'
                                    : 'hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 cursor-pointer'
                                  }`}
                              >
                                <span className="text-zinc-900 dark:text-zinc-100 truncate">{svc.name}</span>
                                <div className="flex items-center gap-2.5 text-xs text-zinc-400 shrink-0">
                                  <span className="flex items-center gap-1">
                                    <Clock className="size-3" />
                                    {svc.duration} min
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Euro className="size-3" />
                                    {svc.price.toFixed(2)}
                                  </span>
                                  {added && <Check className="size-3.5 text-indigo-500" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Selected services list */}
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass}>
              <Check className="size-3.5" />
              Servizi selezionati
              {selectedServices.length > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center size-4 rounded-full bg-indigo-500/15 text-indigo-500 text-[10px] font-semibold">
                  {selectedServices.length}
                </span>
              )}
            </label>

            <div className="flex flex-col rounded-lg border border-zinc-500/25 overflow-hidden bg-white dark:bg-zinc-800/40">
              {selectedServices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-zinc-400">
                  <Scissors className="size-7 opacity-20" />
                  <p className="text-sm">Nessun servizio selezionato</p>
                  <p className="text-xs opacity-60">Cerca e clicca per aggiungere</p>
                </div>
              ) : (
                <>
                  <div className="max-h-52 overflow-y-auto divide-y divide-zinc-500/10">
                    {selectedServices.map((svc, i) => (
                      <div key={svc.id} className="flex items-center justify-between px-3 py-2.5 group">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 shrink-0 text-xs font-mono text-zinc-400 select-none">
                            {i + 1}.
                          </span>
                          <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
                            {svc.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0 ml-2">
                          <span className="text-xs text-zinc-400 flex items-center gap-1">
                            <Clock className="size-3" />
                            {svc.duration} min
                          </span>
                          <span className="text-xs text-zinc-400 flex items-center gap-1">
                            <Euro className="size-3" />
                            {svc.price.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeService(svc.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-all"
                            aria-label="Rimuovi servizio"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals footer */}
                  <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-500/15 bg-zinc-50 dark:bg-zinc-700/30">
                    <span className="text-xs text-zinc-500 font-medium">Totale</span>
                    <div className="flex items-center gap-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 text-zinc-400" />
                        {totalDuration} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Euro className="size-3 text-zinc-400" />
                        {totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AddModal>
  );
}
