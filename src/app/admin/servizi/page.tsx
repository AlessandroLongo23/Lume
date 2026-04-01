'use client';

import { useState } from 'react';
import { Scissors, Tags } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/services';
import { AddServiceModal } from '@/lib/components/admin/services/AddServiceModal';
import { ManageCategoriesModal } from '@/lib/components/admin/services/ManageCategoriesModal';
import { ServicesTable } from '@/lib/components/admin/services/ServicesTable';

export default function ServiziPage() {
  const services = useServicesStore((s) => s.services);
  const [showAdd, setShowAdd] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);

  return (
    <>
      <AddServiceModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
      <ManageCategoriesModal isOpen={showManageCategories} onClose={() => setShowManageCategories(false)} />

      <div className="flex flex-col gap-8">
        <div className="flex flex-row items-center justify-between gap-4 w-full">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Servizi</h1>
          <div className="flex flex-row items-center gap-4">
            <button
              className="flex flex-row items-center whitespace-nowrap justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-50 rounded-lg border border-zinc-500/25"
              onClick={() => setShowManageCategories(true)}
            >
              <Tags className="size-5" strokeWidth={1.5} />
              <span className="font-thin">Gestisci Categorie</span>
            </button>
            <button
              className="flex flex-row items-center whitespace-nowrap justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-black hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg border border-zinc-500/25"
              onClick={() => setShowAdd(true)}
            >
              <Scissors className="size-5" strokeWidth={1.5} />
              <span className="font-thin">Nuovo Servizio</span>
            </button>
          </div>
        </div>

        <ServicesTable services={services} />
      </div>
    </>
  );
}
