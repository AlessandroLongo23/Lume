'use client';

import { useState, useEffect, useMemo } from 'react';
import { Scissors, User, Clock, Euro, Trash2 } from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import { it } from 'date-fns/locale';
import { useFichesStore } from '@/lib/stores/fiches';
import { useClientsStore } from '@/lib/stores/clients';
import { useOperatorsStore } from '@/lib/stores/operators';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { FicheStatus } from '@/lib/types/ficheStatus';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';
import type { Operator } from '@/lib/types/Operator';
import type { Service } from '@/lib/types/Service';

interface FicheServiceItem {
  service_id: string;
  name: string;
  operator_id: string;
  start_time: Date;
  end_time: Date;
  duration: number;
  price: number;
}

interface AddFicheModalProps {
  isOpen: boolean;
  onClose: () => void;
  datetime?: Date;
  operator?: Operator | null;
}

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return new Date().toISOString().split('T')[0];
  return new Date(date).toISOString().split('T')[0];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const emptyForm = (datetime: Date | undefined, _operatorId: string) => ({
  client_id: '' as string | null,
  datetime: formatDateForInput(datetime),
  status: FicheStatus.CREATED,
  note: '',
  ficheServices: [] as FicheServiceItem[],
  totalPrice: 0,
});

export function AddFicheModal({ isOpen, onClose, datetime, operator }: AddFicheModalProps) {
  const addFiche = useFichesStore((s) => s.addFiche);
  const clients = useClientsStore((s) => s.clients);
  const operators = useOperatorsStore((s) => s.operators);
  const services = useServicesStore((s) => s.services);
  const serviceCategories = useServiceCategoriesStore((s) => s.service_categories);

  const [formData, setFormData] = useState(emptyForm(datetime, operator?.id ?? ''));
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData(emptyForm(datetime, operator?.id ?? ''));
      setSelectedServiceCategory(null);
      setSelectedServiceId(null);
      setErrors({});
      setErrorMessage('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    setFormData((f) => ({ ...f, datetime: formatDateForInput(datetime) }));
  }, [datetime]);

  // Recalculate total price and times
  useEffect(() => {
    const total = formData.ficheServices.reduce((acc, s) => acc + (s.price || 0), 0);
    let lastTime = datetime ?? new Date();
    const updated = formData.ficheServices.map((s) => {
      const start = lastTime;
      const end = addMinutes(lastTime, s.duration);
      lastTime = end;
      return { ...s, start_time: start, end_time: end };
    });
    setFormData((f) => ({ ...f, totalPrice: total, ficheServices: updated }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.ficheServices.length, datetime]);

  const servicesOptions = useMemo(() => {
    if (!selectedServiceCategory) return services;
    return services.filter((s) => s.category_id === selectedServiceCategory);
  }, [services, selectedServiceCategory]);

  const clientOptions = clients.map((c) => ({ ...c, fullName: c.getFullName() }));

  function addServiceToList(service: Service) {
    const item: FicheServiceItem = {
      service_id: service.id,
      name: service.name,
      operator_id: operator?.id ?? '',
      start_time: new Date(),
      end_time: addMinutes(new Date(), service.duration),
      duration: service.duration,
      price: service.price,
    };
    setFormData((f) => ({ ...f, ficheServices: [...f.ficheServices, item] }));
    setSelectedServiceId(null);
  }

  function removeService(index: number) {
    setFormData((f) => ({ ...f, ficheServices: f.ficheServices.filter((_, i) => i !== index) }));
  }

  function updateServiceOperator(index: number, operatorId: string) {
    setFormData((f) => {
      const updated = [...f.ficheServices];
      updated[index] = { ...updated[index], operator_id: operatorId };
      return { ...f, ficheServices: updated };
    });
  }

  function updateServiceDuration(index: number, duration: number) {
    setFormData((f) => {
      const updated = [...f.ficheServices];
      updated[index] = { ...updated[index], duration };
      return { ...f, ficheServices: updated };
    });
  }

  const selectedClient = useMemo(() =>
    clients.find((c) => c.id === formData.client_id) ?? null,
    [clients, formData.client_id]
  );

  async function handleSubmit() {
    const newErrors: Record<string, string> = {};
    if (!formData.client_id) newErrors.client_id = 'Seleziona un cliente';
    if (!formData.ficheServices.length) newErrors.services = 'Seleziona almeno un servizio';
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await addFiche({ ...formData, client_id: formData.client_id ?? undefined, datetime: new Date(formData.datetime) as any });
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Si è verificato un errore sconosciuto');
    }
  }

  const inputClass = 'w-full px-3 py-2 border border-zinc-300 rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100';
  const labelClass = 'block text-sm font-thin text-zinc-700 dark:text-zinc-300 mb-1';
  const totalDuration = formData.ficheServices.reduce((acc, s) => acc + s.duration, 0);

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Nuova Fiche"
      subtitle="Crea una nuova fiche"
      classes="max-w-6xl w-full max-h-[90vh]"
      contentClasses="max-h-[70vh] overflow-y-auto"
      footerContent={
        <div className="flex flex-col items-start gap-1">
          <div className="text-xl font-bold">Preventivo: € {formData.totalPrice.toFixed(2)}</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Durata: {totalDuration} minuti</div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-row gap-4 items-center justify-between">
          <div className="w-1/2">
            <label className={labelClass}>Data</label>
            <input
              type="date"
              className={inputClass}
              value={formData.datetime}
              onChange={(e) => setFormData((f) => ({ ...f, datetime: e.target.value }))}
            />
          </div>
          <div className="w-1/2">
            <label className={labelClass}>Cliente</label>
            <CustomSelect
              options={clientOptions}
              labelKey="fullName"
              valueKey="id"
              value={formData.client_id ?? ''}
              onChange={(v) => setFormData((f) => ({ ...f, client_id: v }))}
              placeholder="Seleziona cliente"
              searchable
            />
            {errors.client_id && <p className="text-xs text-red-500 mt-1">{errors.client_id}</p>}
          </div>
        </div>

        <div className="flex flex-row gap-4">
          <div className="w-1/2">
            <label className={labelClass}>Ultima nota tecnica</label>
            <textarea
              className={`${inputClass} h-28`}
              readOnly
              value={selectedClient?.getLastNote?.() ?? ''}
            />
          </div>
          <div className="w-1/2">
            <label className={labelClass}>Nota appuntamento</label>
            <textarea
              className={`${inputClass} h-28`}
              value={formData.note}
              onChange={(e) => setFormData((f) => ({ ...f, note: e.target.value }))}
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex flex-row justify-start items-center gap-2">
            <Scissors className="size-5 text-zinc-700 dark:text-zinc-300 mb-2" />
            <h3 className="text-lg font-medium mb-2 uppercase">Servizi</h3>
          </div>

          <div className="flex flex-row gap-4 mb-4">
            <div className="w-1/2">
              <label className={labelClass}>Categoria</label>
              <CustomSelect
                options={serviceCategories}
                labelKey="name"
                valueKey="id"
                value={selectedServiceCategory ?? ''}
                onChange={setSelectedServiceCategory}
                placeholder="Tutte le categorie"
              />
            </div>
            <div className="w-1/2">
              <label className={labelClass}>Servizio</label>
              <CustomSelect
                options={servicesOptions}
                labelKey="name"
                valueKey="id"
                value={selectedServiceId ?? ''}
                onChange={setSelectedServiceId}
                placeholder="Seleziona servizio"
              />
            </div>
            <button
              type="button"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
              disabled={!selectedServiceId}
              onClick={() => {
                if (selectedServiceId) {
                  const service = services.find((s) => s.id === selectedServiceId);
                  if (service) addServiceToList(service);
                }
              }}
            >
              Aggiungi
            </button>
          </div>

          {errors.services && <p className="text-xs text-red-500 mb-2">{errors.services}</p>}

          <div className="border border-zinc-300 dark:border-zinc-700 rounded-md">
            {formData.ficheServices.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">Nessun servizio selezionato</div>
            ) : (
              <table className="w-full table-auto">
                <thead className="bg-zinc-100 dark:bg-zinc-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left"><div className="flex items-center gap-2"><Scissors className="size-4" /><span>Servizio</span></div></th>
                    <th className="px-4 py-1 text-left"><div className="flex items-center gap-2"><User className="size-4" /><span>Operatore</span></div></th>
                    <th className="px-4 py-1 text-left"><div className="flex items-center gap-2"><Clock className="size-4" /><span>Tempo (min)</span></div></th>
                    <th className="px-4 py-1 text-center">Inizio</th>
                    <th className="px-4 py-1 text-center">Fine</th>
                    <th className="px-4 py-1 text-right"><div className="flex items-center justify-end gap-2"><Euro className="size-4" /><span>Prezzo</span></div></th>
                    <th className="px-4 py-1" />
                  </tr>
                </thead>
                <tbody>
                  {formData.ficheServices.map((service, index) => (
                    <tr key={index} className="border-t border-zinc-200 dark:border-zinc-700">
                      <td className="px-4 py-2">{service.name}</td>
                      <td className="px-4 py-2">
                        <CustomSelect
                          options={operators.map((op) => ({ ...op, fullName: op.getFullName() }))}
                          labelKey="fullName"
                          valueKey="id"
                          value={service.operator_id}
                          onChange={(v) => updateServiceOperator(index, v)}
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="number"
                          value={service.duration}
                          onChange={(e) => updateServiceDuration(index, parseInt(e.target.value))}
                          min={5}
                          step={5}
                          className="w-20 px-2 py-1 text-center border border-zinc-300 rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">{format(service.start_time, 'HH:mm', { locale: it })}</td>
                      <td className="px-4 py-2 text-center">{format(service.end_time, 'HH:mm', { locale: it })}</td>
                      <td className="px-4 py-2 text-right">€ {parseFloat(String(service.price)).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                          onClick={() => removeService(index)}
                          aria-label="Rimuovi servizio"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}
      </div>
    </AddModal>
  );
}
