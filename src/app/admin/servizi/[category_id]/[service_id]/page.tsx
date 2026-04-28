'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { Trash2, Scissors, Archive, ArchiveRestore, FileX } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { trackRecent } from '@/lib/components/shell/commandMenu/recents';
import { ConfirmDialog } from '@/lib/components/shared/ui/modals/ConfirmDialog';
import {
  DetailHero,
  DetailSection,
  DetailHeroActions,
  DetailChip,
  HeroIconTile,
  StatTile,
} from '@/lib/components/shared/ui/detail';
import { DeleteServiceModal } from '@/lib/components/admin/services/DeleteServiceModal';
import { ServiceForm, type ServiceFormValue, type ServiceFormErrors } from '@/lib/components/admin/services/ServiceForm';
import type { Service } from '@/lib/types/Service';

function formatEur(amount: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function formatDuration(minutes: number): string {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

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
  const searchParams = useSearchParams();
  const services = useServicesStore((s) => s.services);
  const isLoading = useServicesStore((s) => s.isLoading);
  const updateService = useServicesStore((s) => s.updateService);
  const archiveService = useServicesStore((s) => s.archiveService);
  const restoreService = useServicesStore((s) => s.restoreService);
  const categories = useServiceCategoriesStore((s) => s.service_categories);

  const [service, setService] = useState<Service | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ServiceFormValue>({});
  const [errors, setErrors] = useState<ServiceFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState<{ action: () => void } | null>(null);

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
      else setError('Servizio non trovato');
    }
  }, [services, serviceId, isLoading]);

  useEffect(() => {
    if (!service) return;
    const subtitle = service.price
      ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(service.price)
      : undefined;
    trackRecent({
      type: 'service',
      id: service.id,
      label: service.name || 'Servizio',
      subtitle,
      href: `/admin/servizi/${service.category_id}/${service.id}`,
    });
  }, [service]);

  useEffect(() => {
    if (!service) return;
    if (searchParams.get('edit') !== service.id) return;
    setDraft(serviceToDraft(service));
    setErrors({});
    setIsEditing(true);
    router.replace(`/admin/servizi/${service.category_id}/${service.id}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, searchParams]);

  const handleEnterEdit = () => {
    if (!service) return;
    setDraft(serviceToDraft(service));
    setErrors({});
    setIsEditing(true);
  };

  const exitEditMode = () => {
    setIsEditing(false);
    setDraft({});
    setErrors({});
  };

  const handleCancel = () => {
    if (isDirty) {
      setDiscardConfirm({ action: exitEditMode });
      return;
    }
    exitEditMode();
  };

  const handleBack = () => {
    const goBack = () => router.push(`/admin/servizi/${categoryId}`);
    if (isEditing && isDirty) {
      setDiscardConfirm({ action: goBack });
      return;
    }
    goBack();
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore durante l'aggiornamento.";
      messagePopup.getState().error(msg);
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
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-16 h-16 border-4 border-zinc-500/25 border-t-primary rounded-full animate-spin" />
        <p className="mt-4 text-zinc-500 dark:text-zinc-400">Caricamento...</p>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <FileX className="size-16 text-zinc-300 dark:text-zinc-600 mb-4" strokeWidth={1.5} />
        <h2 className="text-xl font-semibold text-zinc-700 dark:text-zinc-200 mb-2">Servizio non trovato</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{error ?? 'Il servizio non esiste o è stato rimosso.'}</p>
        <button
          className="mt-6 px-4 py-2 text-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-md transition-colors"
          onClick={() => router.push(`/admin/servizi/${categoryId}`)}
        >
          Torna ai servizi
        </button>
      </div>
    );
  }

  const category = categories.find((c) => c.id === service.category_id);
  const margin = (service.price ?? 0) - (service.product_cost ?? 0);
  const marginPct = service.price ? Math.round((margin / service.price) * 100) : 0;
  const marginTone = marginPct >= 70 ? 'emerald' : marginPct >= 40 ? 'sky' : marginPct >= 0 ? 'amber' : 'red';

  return (
    <>
      <DeleteServiceModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        selectedService={service}
        onDeleted={() => router.push(`/admin/servizi/${categoryId}`)}
      />
      <ConfirmDialog
        isOpen={discardConfirm !== null}
        onClose={() => setDiscardConfirm(null)}
        onConfirm={() => {
          discardConfirm?.action();
          setDiscardConfirm(null);
        }}
        title="Scartare le modifiche?"
        description="Le modifiche non salvate andranno perse."
        confirmLabel="Scarta"
        tone="warning"
      />

      <div className="flex flex-col">
        <DetailHero
          onBack={handleBack}
          avatar={<HeroIconTile icon={Scissors} tone="primary" />}
          title={service.name}
          chips={
            <>
              {service.isArchived && <DetailChip tone="amber">Archiviato</DetailChip>}
              {category && <DetailChip tone="zinc">{category.name}</DetailChip>}
            </>
          }
          meta={<span>Servizio</span>}
          actions={
            <DetailHeroActions
              isEditing={isEditing}
              isLocked={service.isArchived}
              saving={saving}
              isDirty={isDirty}
              onEdit={handleEnterEdit}
              onCancel={handleCancel}
              onSave={handleSave}
              menuItems={[
                {
                  label: service.isArchived ? 'Ripristina' : 'Archivia',
                  icon: service.isArchived ? ArchiveRestore : Archive,
                  onClick: handleToggleArchive,
                },
                { label: 'Elimina', icon: Trash2, onClick: () => setShowDelete(true) },
              ]}
            />
          }
        />

        <div className="px-6 lg:px-10 py-8 max-w-5xl w-full mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            {isEditing ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <DetailSection label="Modifica servizio">
                  <ServiceForm value={draft} onChange={setDraft} errors={errors} />
                </DetailSection>
              </motion.div>
            ) : (
              <motion.div
                key="view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col gap-12"
              >
                <DetailSection index={0} label="Economics">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <StatTile label="Durata" value={formatDuration(service.duration)} />
                    <StatTile label="Prezzo" value={formatEur(service.price ?? 0)} />
                    <StatTile
                      label="Margine"
                      value={formatEur(margin)}
                      accent={service.price ? { tone: marginTone, text: `${marginPct}%` } : undefined}
                      hint={service.product_cost > 0 ? `Costo prodotti: ${formatEur(service.product_cost)}` : undefined}
                    />
                  </div>
                </DetailSection>

                <DetailSection index={1} label="Descrizione">
                  {service.description?.trim() ? (
                    <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                      {service.description}
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">
                      Nessuna descrizione
                    </p>
                  )}
                </DetailSection>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
