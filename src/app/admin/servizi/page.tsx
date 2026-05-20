'use client';

import { useState, useEffect, useMemo } from 'react';
import { Scissors, Tags, Plus, ArrowDownToLine, FileDown, Archive, Trash2 } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { supabase } from '@/lib/supabase/client';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { DeleteAllModal } from '@/lib/components/shared/ui/modals/DeleteAllModal';
import { AddServiceModal } from '@/lib/components/admin/services/AddServiceModal';
import { AddServiceCategoryModal } from '@/lib/components/admin/services/AddServiceCategoryModal';
import { ServicesTable } from '@/lib/components/admin/services/ServicesTable';
import { CategorieServiziTab } from '@/lib/components/admin/services/CategorieServiziTab';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { NumberBadge } from '@/lib/components/shared/ui/NumberBadge';
import { Button } from '@/lib/components/shared/ui/Button';
import { DropdownMenu, type DropdownMenuItem } from '@/lib/components/shared/ui/DropdownMenu';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOrderedTabs } from '@/lib/hooks/useOrderedTabs';
import { TAB_DEFAULTS } from '@/lib/const/tab-defaults';

type Tab = 'servizi' | 'categorie';

const TAB_META: Record<Tab, { label: string; icon: React.ElementType }> = {
  servizi: { label: 'Servizi', icon: Scissors },
  categorie: { label: 'Categorie', icon: Tags },
};

const IMPORT_ENTITY_FOR_TAB = {
  servizi: { entity: 'services' as const, label: 'Importa servizi' },
  categorie: { entity: 'serviceCategories' as const, label: 'Importa categorie' },
};

const DEFAULT_ORDER = TAB_DEFAULTS.servizi as readonly Tab[];

export default function ServiziPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const services = useServicesStore((s) => s.services);
  const isLoading = useServicesStore((s) => s.isLoading);
  const fetchServices = useServicesStore((s) => s.fetchServices);
  const deleteAllServices = useServicesStore((s) => s.deleteAllServices);
  const categories = useServiceCategoriesStore((s) => s.service_categories);
  const isCategoriesLoading = useServiceCategoriesStore((s) => s.isLoading);
  const fetchServiceCategories = useServiceCategoriesStore((s) => s.fetchServiceCategories);

  const { visible } = useOrderedTabs<Tab>('servizi', DEFAULT_ORDER);
  const [userTab, setUserTab] = useState<Tab | null>(null);
  const activeTab: Tab = userTab && visible.includes(userTab) ? userTab : visible[0];
  const setActiveTab = (t: Tab) => setUserTab(t);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  const [servicesShowArchived, setServicesShowArchived] = useState(false);
  const [categoriesShowArchived, setCategoriesShowArchived] = useState(false);
  const [usageCounts, setUsageCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    fetchServices();
    fetchServiceCategories();
  }, [fetchServices, fetchServiceCategories]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const counts = new Map<string, number>();
      const PAGE = 1000;
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from('fiche_services')
          .select('service_id')
          .range(from, from + PAGE - 1);
        if (error || !data) break;
        for (const row of data) {
          const id = (row as { service_id: string | null }).service_id;
          if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
        }
        if (data.length < PAGE) break;
        from += PAGE;
      }
      if (!cancelled) setUsageCounts(counts);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setActiveTab('servizi');
      setShowAdd(true);
      router.replace('/admin/servizi');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const servicesArchivedCount = services.filter((s) => s.isArchived).length;
  const categoriesArchivedCount = categories.filter((c) => c.isArchived).length;

  const visibleServices = useMemo(
    () => services.filter((s) => (servicesShowArchived ? s.isArchived : !s.isArchived)),
    [services, servicesShowArchived]
  );

  const visibleCategories = useMemo(
    () => categories.filter((c) => (categoriesShowArchived ? c.isArchived : !c.isArchived)),
    [categories, categoriesShowArchived]
  );

  const isServiziTab = activeTab === 'servizi';
  const tabShowArchived = isServiziTab ? servicesShowArchived : categoriesShowArchived;
  const toggleTabShowArchived = () => {
    if (isServiziTab) setServicesShowArchived((v) => !v);
    else setCategoriesShowArchived((v) => !v);
  };
  const tabArchivedCount = isServiziTab ? servicesArchivedCount : categoriesArchivedCount;
  const entityLabel = isServiziTab ? 'servizi' : 'categorie';

  const menuItems: DropdownMenuItem[] = [
    {
      label: tabShowArchived ? `Mostra ${entityLabel} attivi` : `Mostra ${entityLabel} archiviati`,
      icon: Archive,
      onClick: toggleTabShowArchived,
      badge: tabArchivedCount > 0 ? tabArchivedCount : undefined,
    },
    { label: IMPORT_ENTITY_FOR_TAB[activeTab].label, icon: ArrowDownToLine, onClick: () => setShowImport(true) },
    { label: 'Scarica PDF', icon: FileDown, onClick: () => { /* TODO: export PDF */ } },
    ...(isServiziTab && services.length > 0
      ? ([{ label: 'Elimina tutti', icon: Trash2, onClick: () => setShowDeleteAll(true), destructive: true }] as DropdownMenuItem[])
      : []),
  ];

  return (
    <>
      <AddServiceModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
      <AddServiceCategoryModal isOpen={showAddCategory} onClose={() => setShowAddCategory(false)} selectedCategory={null} />
      <ConciergeImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        entity={IMPORT_ENTITY_FOR_TAB[activeTab].entity}
      />
      <DeleteAllModal
        isOpen={showDeleteAll}
        onClose={() => setShowDeleteAll(false)}
        entityLabel="servizi"
        count={services.length}
        cascadeNotice={
          <>
            Verranno eliminati anche i <strong>servizi presenti nelle fiche già esistenti</strong>:
            lo storico dei trattamenti effettuati ne risulterà parzialmente alterato.
          </>
        }
        onConfirm={deleteAllServices}
      />

      <div className="flex-1 min-h-0 flex flex-col gap-6" data-tour="servizi-page">
        <PageHeader
          title="Servizi"
          subtitle="Tutto quello che il tuo salone sa fare."
          icon={Scissors}
          actions={
            <>
              {isServiziTab ? (
                <Button variant="primary" leadingIcon={Plus} onClick={() => setShowAdd(true)} data-tour="action-service-create">
                  Nuovo Servizio
                </Button>
              ) : (
                <Button variant="primary" leadingIcon={Plus} onClick={() => setShowAddCategory(true)}>
                  Nuova Categoria
                </Button>
              )}
              <DropdownMenu items={menuItems} />
            </>
          }
        />

        {/* Tab nav */}
        <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
          {visible.map((id) => {
            const { label, icon: Icon } = TAB_META[id];
            const isActive = activeTab === id;
            const archivedForTab = id === 'servizi' ? servicesShowArchived : categoriesShowArchived;
            const archivedCountForTab = id === 'servizi' ? servicesArchivedCount : categoriesArchivedCount;
            const totalForTab = id === 'servizi'
              ? (servicesShowArchived ? servicesArchivedCount : services.length - servicesArchivedCount)
              : (categoriesShowArchived ? categoriesArchivedCount : categories.length - categoriesArchivedCount);
            const displayLabel = archivedForTab ? `${label} archiviati` : label;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'border-primary text-primary-hover dark:text-primary/70'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300'
                }`}
              >
                <Icon className="size-4" />
                {displayLabel}
                {archivedForTab
                  ? archivedCountForTab > 0 && (
                      <span className="ml-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        {archivedCountForTab}
                      </span>
                    )
                  : <NumberBadge value={totalForTab} variant={isActive ? 'primary' : 'neutral'} size="md" />
                }
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'servizi' && (
          isLoading ? (
            <TableSkeleton />
          ) : services.length === 0 ? (
            <EmptyState
              icon={Scissors}
              title="Nessun servizio trovato"
              description="Aggiungi il tuo primo servizio per iniziare a gestire il listino."
              secondaryAction={{ label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) }}
              action={{ label: 'Nuovo Servizio', icon: Scissors, onClick: () => setShowAdd(true) }}
            />
          ) : visibleServices.length === 0 ? (
            servicesShowArchived ? (
              <EmptyState
                icon={Archive}
                title="Nessun servizio archiviato"
                description="Quando archivi un servizio lo trovi qui."
              />
            ) : (
              <EmptyState
                icon={Scissors}
                title="Nessun servizio attivo"
                description="Tutti i tuoi servizi sono archiviati."
              />
            )
          ) : (
            <ServicesTable services={visibleServices} showArchived={servicesShowArchived} usageCounts={usageCounts} />
          )
        )}
        {activeTab === 'categorie' && (
          isCategoriesLoading ? (
            <TableSkeleton />
          ) : categories.length === 0 ? (
            <EmptyState
              icon={Tags}
              title="Nessuna categoria trovata"
              description="Crea la tua prima categoria per organizzare i servizi del listino."
              secondaryAction={{ label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) }}
              action={{ label: 'Nuova Categoria', icon: Tags, onClick: () => setShowAddCategory(true) }}
            />
          ) : (
            <CategorieServiziTab categories={visibleCategories} showArchived={categoriesShowArchived} />
          )
        )}
      </div>
    </>
  );
}
