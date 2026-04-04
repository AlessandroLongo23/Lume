'use client';

import { useState, useEffect } from 'react';
import { Scissors, Tags, Plus, ArrowDownToLine, FileDown } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { AddServiceModal } from '@/lib/components/admin/services/AddServiceModal';
import { AddServiceCategoryModal } from '@/lib/components/admin/services/AddServiceCategoryModal';
import { ServicesTable } from '@/lib/components/admin/services/ServicesTable';
import { CategorieServiziTab } from '@/lib/components/admin/services/CategorieServiziTab';
import { DropdownMenu } from '@/lib/components/shared/ui/DropdownMenu';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';

type Tab = 'servizi' | 'categorie';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'servizi', label: 'Servizi', icon: Scissors },
  { id: 'categorie', label: 'Categorie', icon: Tags },
];

export default function ServiziPage() {
  const services = useServicesStore((s) => s.services);
  const isLoading = useServicesStore((s) => s.isLoading);
  const fetchServices = useServicesStore((s) => s.fetchServices);
  const categories = useServiceCategoriesStore((s) => s.service_categories);
  const isCategoriesLoading = useServiceCategoriesStore((s) => s.isLoading);
  const fetchServiceCategories = useServiceCategoriesStore((s) => s.fetchServiceCategories);

  const [activeTab, setActiveTab] = useState<Tab>('servizi');
  const [showAdd, setShowAdd] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchServiceCategories();
  }, [fetchServices, fetchServiceCategories]);

  return (
    <>
      <AddServiceModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
      <AddServiceCategoryModal isOpen={showAddCategory} onClose={() => setShowAddCategory(false)} selectedCategory={null} />
      <ConciergeImportModal isOpen={showImport} onClose={() => setShowImport(false)} />

      <div className="flex flex-col gap-6">
        <PageHeader
          title="Servizi"
          icon={Scissors}
          actions={
            activeTab === 'servizi' ? (
              <>
                <button
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                  onClick={() => setShowAdd(true)}
                >
                  <Plus className="size-4" />
                  Nuovo Servizio
                </button>
                <DropdownMenu items={[
                  { label: 'Scarica PDF', icon: FileDown, onClick: () => { /* TODO: export PDF */ } },
                ]} />
              </>
            ) : (
              <>
                <button
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                  onClick={() => setShowAddCategory(true)}
                >
                  <Plus className="size-4" />
                  Nuova Categoria
                </button>
                <DropdownMenu items={[
                  { label: 'Scarica PDF', icon: FileDown, onClick: () => { /* TODO: export PDF */ } },
                ]} />
              </>
            )
          }
        />

        {/* Tab nav */}
        <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300'
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'servizi' && (
          !isLoading && services.length === 0 ? (
            <EmptyState
              icon={Scissors}
              title="Nessun servizio trovato"
              description="Aggiungi il tuo primo servizio per iniziare a gestire il listino."
              secondaryAction={{ label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) }}
              action={{ label: 'Nuovo Servizio', icon: Scissors, onClick: () => setShowAdd(true) }}
            />
          ) : (
            <ServicesTable services={services} />
          )
        )}
        {activeTab === 'categorie' && (
          !isCategoriesLoading && categories.length === 0 ? (
            <EmptyState
              icon={Tags}
              title="Nessuna categoria trovata"
              description="Crea la tua prima categoria per organizzare i servizi del listino."
              secondaryAction={{ label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) }}
              action={{ label: 'Nuova Categoria', icon: Tags, onClick: () => setShowAddCategory(true) }}
            />
          ) : (
            <CategorieServiziTab />
          )
        )}
      </div>
    </>
  );
}
