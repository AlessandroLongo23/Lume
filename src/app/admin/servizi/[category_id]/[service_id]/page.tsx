'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Clock, Euro, FileText } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { EditServiceModal } from '@/lib/components/admin/services/EditServiceModal';
import { DeleteServiceModal } from '@/lib/components/admin/services/DeleteServiceModal';
import type { Service } from '@/lib/types/Service';

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const services = useServicesStore((s) => s.services);
  const isLoading = useServicesStore((s) => s.isLoading);
  const categories = useServiceCategoriesStore((s) => s.service_categories);

  const [service, setService] = useState<Service | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editedService, setEditedService] = useState<Partial<Service>>({});

  const categoryId = params.category_id as string;
  const serviceId = params.service_id as string;

  useEffect(() => {
    if (!isLoading) {
      const found = services.find((s) => s.id === serviceId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (found) setService(found);
    }
  }, [services, serviceId, isLoading]);

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
      <EditServiceModal isOpen={showEdit} onClose={() => setShowEdit(false)} selectedService={service} editedService={editedService} onEditedServiceChange={setEditedService} />
      <DeleteServiceModal isOpen={showDelete} onClose={() => setShowDelete(false)} selectedService={service} />

      <div className="flex flex-col gap-4 max-w-2xl">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/admin/servizi/${categoryId}`)} className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors">
            <ArrowLeft className="size-5 text-zinc-600 dark:text-zinc-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{service.name}</h1>
            <p className="text-sm text-zinc-500">{category?.name ?? 'Servizio'}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => { setEditedService(service); setShowEdit(true); }} className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 rounded-md">
              <Edit className="size-5 text-zinc-600 dark:text-zinc-300" />
            </button>
            <button onClick={() => setShowDelete(true)} className="p-2 bg-zinc-100 hover:bg-red-100 dark:bg-zinc-800 rounded-md">
              <Trash2 className="size-5 text-zinc-600 dark:text-zinc-300" />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-500/25 p-6 grid grid-cols-2 gap-6">
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
      </div>
    </>
  );
}
