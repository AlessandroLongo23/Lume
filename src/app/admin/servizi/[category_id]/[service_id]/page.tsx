'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Clock, Euro, FileText, ShoppingCart, Archive, ArchiveRestore, Save, X } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { DeleteServiceModal } from '@/lib/components/admin/services/DeleteServiceModal';
import { ServiceForm, type ServiceFormValue, type ServiceFormErrors } from '@/lib/components/admin/services/ServiceForm';
import type { Service } from '@/lib/types/Service';

function serviceToDraft(service: Service): ServiceFormValue {
  return {
    name: service.name,
    category_id: service.category_id,
    duration: service.duration,
    price: service.price,
    product_cost: service.product_cost,
    description: service.description,
  };
}

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const services = useServicesStore((s) => s.services);
  const isLoading = useServicesStore((s) => s.isLoading);
  const updateService = useServicesStore((s) => s.updateService);
  const archiveService = useServicesStore((s) => s.archiveService);
  const restoreService = useServicesStore((s) => s.restoreService);
  const categories = useServiceCategoriesStore((s) => s.service_categories);

  const [service, setService] = useState<Service | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ServiceFormValue>({});
  const [errors, setErrors] = useState<ServiceFormErrors>({});
  const [saving, setSaving] = useState(false);

  const categoryId = params.category_id as string;
  const serviceId = params.service_id as string;

  const isDirty = useMemo(() => {
    if (!isEditing || !service) return false;
    const baseline = serviceToDraft(service);
    const keys: (keyof ServiceFormValue)[] = ['name', 'category_id', 'duration', 'price', 'product_cost', 'description'];
    return keys.some((k) => (draft[k] ?? '') !== (baseline[k] ?? ''));
  }, [isEditing, draft, service]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  useEffect(() => {
    if (!isLoading) {
      const found = services.find((s) => s.id === serviceId);
      if (found) setService(found);
    }
  }, [services, serviceId, isLoading]);

  const handleEnterEdit = () => {
    if (!service) return;
    setDraft(serviceToDraft(service));
    setErrors({});
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm('Scartare le modifiche?')) return;
    setIsEditing(false);
    setDraft({});
    setErrors({});
  };

  const handleBack = () => {
    if (isEditing && isDirty && !window.confirm('Scartare le modifiche?')) return;
    router.push(`/admin/servizi/${categoryId}`);
  };

  const handleSave = async () => {
    if (!service) return;

    const newErrors: ServiceFormErrors = {};
    if (!draft.name?.trim()) newErrors.name = 'Inserisci un nome';
    if (!draft.category_id) newErrors.category_id = 'Seleziona una categoria';
    if ((draft.price ?? 0) < 0) newErrors.price = 'Inserisci un prezzo valido';
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      messagePopup.getState().error('Correggi gli errori nel form');
      return;
    }

    setSaving(true);
    try {
      await updateService(service.id, { ...service, ...draft });
      messagePopup.getState().success('Servizio aggiornato con successo!');
      setIsEditing(false);
      setDraft({});
      setErrors({});
    } catch {
      messagePopup.getState().error("Errore durante l'aggiornamento.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleArchive = async () => {
    if (!service) return;
    try {
      if (service.isArchived) {
        await restoreService(service.id);
        messagePopup.getState().success('Servizio ripristinato.');
      } else {
        await archiveService(service.id);
        messagePopup.getState().success('Servizio archiviato.');
        router.push(`/admin/servizi/${categoryId}`);
      }
    } catch {
      messagePopup.getState().error("Errore durante l'operazione.");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="w-12 h-12 border-4 border-zinc-500/25 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <h2 className="text-xl font-bold">Servizio non trovato</h2>
        <button className="mt-4 px-4 py-2 bg-zinc-200 rounded-md" onClick={() => router.push(`/admin/servizi/${categoryId}`)}>Torna indietro</button>
      </div>
    );
  }

  const category = categories.find((c) => c.id === service.category_id);

  return (
    <>
      <DeleteServiceModal isOpen={showDelete} onClose={() => setShowDelete(false)} selectedService={service} onDeleted={() => router.push(`/admin/servizi/${categoryId}`)} />

      <div className="flex flex-col gap-4 max-w-2xl">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors">
            <ArrowLeft className="size-5 text-zinc-600 dark:text-zinc-300" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{service.name}</h1>
              {service.isArchived && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">Archiviato</span>
              )}
            </div>
            <p className="text-sm text-zinc-500">{category?.name ?? 'Servizio'}</p>
          </div>
          <div className="ml-auto flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-md transition-colors disabled:opacity-50"
                >
                  <X className="size-4" />
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50"
                >
                  <Save className="size-4" />
                  {saving ? 'Salvando...' : 'Salva'}
                </button>
              </>
            ) : (
              <>
                {!service.isArchived && (
                  <button onClick={handleEnterEdit} className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 rounded-md">
                    <Edit className="size-5 text-zinc-600 dark:text-zinc-300" />
                  </button>
                )}
                <button
                  onClick={handleToggleArchive}
                  className="p-2 bg-zinc-100 hover:bg-amber-100 dark:bg-zinc-800 dark:hover:bg-amber-900/30 rounded-md transition-colors"
                  title={service.isArchived ? 'Ripristina servizio' : 'Archivia servizio'}
                >
                  {service.isArchived ? <ArchiveRestore className="size-5 text-zinc-600 dark:text-zinc-300" /> : <Archive className="size-5 text-zinc-600 dark:text-zinc-300" />}
                </button>
                <button onClick={() => setShowDelete(true)} className="p-2 bg-zinc-100 hover:bg-red-100 dark:bg-zinc-800 rounded-md">
                  <Trash2 className="size-5 text-zinc-600 dark:text-zinc-300" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-500/25 p-6">
          {isEditing ? (
            <ServiceForm value={draft} onChange={setDraft} errors={errors} />
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <Clock className="size-4 text-zinc-500" />
                <div>
                  <p className="text-xs text-zinc-500">Durata</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{service.duration} min</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Euro className="size-4 text-zinc-500" />
                <div>
                  <p className="text-xs text-zinc-500">Prezzo</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">€ {service.price?.toFixed(2) ?? '0.00'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ShoppingCart className="size-4 text-zinc-500" />
                <div>
                  <p className="text-xs text-zinc-500">Costo prodotti</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">€ {service.product_cost?.toFixed(2) ?? '0.00'}</p>
                </div>
              </div>
              {service.description && (
                <div className="col-span-2 flex items-start gap-3">
                  <FileText className="size-4 text-zinc-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Descrizione</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{service.description}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
