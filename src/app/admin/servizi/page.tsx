'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Scissors, Tags, Plus, ArrowDownToLine, FileDown, EllipsisVertical, Archive, Trash2 } from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

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

      <div className="flex-1 min-h-0 flex flex-col gap-6">
        <PageHeader
          title="Servizi"
          subtitle="Tutto quello che il tuo salone sa fare."
          icon={Scissors}
          actions={
            <>
              {isServiziTab ? (
                <Button variant="primary" leadingIcon={Plus} onClick={() => setShowAdd(true)}>
                  Nuovo Servizio
                </Button>
              ) : (
                <Button variant="primary" leadingIcon={Plus} onClick={() => setShowAddCategory(true)}>
                  Nuova Categoria
                </Button>
              )}
              <div className="relative" ref={menuRef}>
                <Button
                  variant="secondary"
                  size="md"
                  iconOnly
                  aria-label="Altre azioni"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <EllipsisVertical />
                </Button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-500/25 rounded-lg shadow-lg z-dropdown py-1">
                    <button
                      className="flex flex-row items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-zinc-700 dark:text-zinc-300"
                      onClick={() => { toggleTabShowArchived(); setMenuOpen(false); }}
                    >
                      <Archive className="size-4 text-zinc-400" />
                      {tabShowArchived ? `Mostra ${entityLabel} attivi` : `Mostra ${entityLabel} archiviati`}
                      {tabArchivedCount > 0 && (
                        <span className="ml-auto text-xs font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                          {tabArchivedCount}
                        </span>
                      )}
                    </button>
                    <button
                      className="flex flex-row items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-zinc-700 dark:text-zinc-300"
                      onClick={() => { setShowImport(true); setMenuOpen(false); }}
                    >
                      <ArrowDownToLine className="size-4 text-zinc-400" />
                      {IMPORT_ENTITY_FOR_TAB[activeTab].label}
                    </button>
                    <button
                      className="flex flex-row items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-zinc-700 dark:text-zinc-300"
                      onClick={() => { setMenuOpen(false); /* TODO: export PDF */ }}
                    >
                      <FileDown className="size-4 text-zinc-400" />
                      Scarica PDF
                    </button>
                    {isServiziTab && services.length > 0 && (
                      <>
                        <div className="my-1 border-t border-zinc-500/25" />
                        <button
                          className="flex flex-row items-center gap-3 w-full px-4 py-2.5 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          onClick={() => { setShowDeleteAll(true); setMenuOpen(false); }}
                        >
                          <Trash2 className="size-4 text-red-500" />
                          Elimina tutti
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
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
