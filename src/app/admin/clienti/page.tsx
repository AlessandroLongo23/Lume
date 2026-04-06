'use client';

import { useState } from 'react';
import { UserPlus, FileDown, FileSpreadsheet, TableProperties, LayoutGrid, Users, ArrowDownToLine, Tags } from 'lucide-react';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { useClientsStore } from '@/lib/stores/clients';
import { useClientCategoriesStore } from '@/lib/stores/client_categories';
import { useViewsStore } from '@/lib/stores/views';
import { AddClientModal } from '@/lib/components/admin/clients/AddClientModal';
import { AddClientCategoryModal } from '@/lib/components/admin/clients/AddClientCategoryModal';
import { ClientsTable } from '@/lib/components/admin/clients/ClientsTable';
import { ClientsGrid } from '@/lib/components/admin/clients/ClientsGrid';
import { CategorieClientiTab } from '@/lib/components/admin/clients/CategorieClientiTab';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { DropdownMenu } from '@/lib/components/shared/ui/DropdownMenu';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';

type Tab = 'clienti' | 'categorie';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'clienti', label: 'Clienti', icon: Users },
  { id: 'categorie', label: 'Categorie', icon: Tags },
];

export default function ClientiPage() {
  const clients = useClientsStore((s) => s.clients);
  const isLoading = useClientsStore((s) => s.isLoading);
  const categories = useClientCategoriesStore((s) => s.client_categories);
  const isCategoriesLoading = useClientCategoriesStore((s) => s.isLoading);
  const view = useViewsStore((s) => s.clients);
  const setView = useViewsStore((s) => s.setView);

  const [activeTab, setActiveTab] = useState<Tab>('clienti');
  const [showAdd, setShowAdd] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showImport, setShowImport] = useState(false);

  return (
    <>
      <AddClientModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
      <AddClientCategoryModal isOpen={showAddCategory} onClose={() => setShowAddCategory(false)} selectedCategory={null} />
      <ConciergeImportModal isOpen={showImport} onClose={() => setShowImport(false)} />

      <div className="flex flex-col gap-6">
        <PageHeader
          title="Clienti"
          icon={Users}
          actions={
            activeTab === 'clienti' ? (
              <>
                <ToggleButton
                  value={view}
                  onChange={(v) => setView('clients', v)}
                  options={['table', 'grid']}
                  labels={['Tabella', 'Griglia']}
                  icons={[TableProperties, LayoutGrid]}
                />
                <button
                  className="flex flex-row items-center whitespace-nowrap justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-black hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg border border-zinc-500/25"
                  onClick={() => setShowAdd(true)}
                >
                  <UserPlus className="size-5" />
                  <span>Nuovo cliente</span>
                </button>
                <DropdownMenu
                  width="w-48"
                  items={[
                    { label: 'Esporta PDF', icon: FileDown, onClick: () => { /* TODO: export PDF */ } },
                    { label: 'Esporta CSV', icon: FileSpreadsheet, onClick: () => { /* TODO: export CSV */ } },
                  ]}
                />
              </>
            ) : (
              <>
                <button
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                  onClick={() => setShowAddCategory(true)}
                >
                  <UserPlus className="size-4" />
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
        {activeTab === 'clienti' && (
          isLoading ? (
            <TableSkeleton />
          ) : clients.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nessun cliente trovato"
              description="Aggiungi il tuo primo cliente per iniziare a gestire la tua lista."
              secondaryAction={{ label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) }}
              action={{ label: 'Nuovo cliente', icon: UserPlus, onClick: () => setShowAdd(true) }}
            />
          ) : view === 'table' ? (
            <ClientsTable clients={clients} />
          ) : (
            <ClientsGrid clients={clients} />
          )
        )}
        {activeTab === 'categorie' && (
          isCategoriesLoading ? (
            <TableSkeleton />
          ) : categories.length === 0 ? (
            <EmptyState
              icon={Tags}
              title="Nessuna categoria trovata"
              description="Crea la tua prima categoria per organizzare i clienti."
              secondaryAction={{ label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) }}
              action={{ label: 'Nuova Categoria', icon: Tags, onClick: () => setShowAddCategory(true) }}
            />
          ) : (
            <CategorieClientiTab />
          )
        )}
      </div>
    </>
  );
}
