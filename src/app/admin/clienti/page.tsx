'use client';

import { useState } from 'react';
import { UserPlus, EllipsisVertical, FileDown, FileSpreadsheet, TableProperties, LayoutGrid, Users, ArrowDownToLine } from 'lucide-react';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { useClientsStore } from '@/lib/stores/clients';
import { useViewsStore } from '@/lib/stores/views';
import { AddClientModal } from '@/lib/components/admin/clients/AddClientModal';
import { ClientsTable } from '@/lib/components/admin/clients/ClientsTable';
import { ClientsGrid } from '@/lib/components/admin/clients/ClientsGrid';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { useRef, useEffect } from 'react';

export default function ClientiPage() {
  const clients = useClientsStore((s) => s.clients);
  const isLoading = useClientsStore((s) => s.isLoading);
  const view = useViewsStore((s) => s.clients);
  const setView = useViewsStore((s) => s.setView);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <>
      <AddClientModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
      <ConciergeImportModal isOpen={showImport} onClose={() => setShowImport(false)} />

      <div className="flex flex-col gap-8">
        <div className="flex flex-row items-center justify-between gap-4 w-full">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Clienti</h1>
          <div className="flex flex-row items-center gap-4">
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
            <div className="relative" ref={menuRef}>
              <button
                className="flex items-center justify-center size-9 rounded-lg border border-zinc-500/25 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <EllipsisVertical className="size-4 text-zinc-500" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-500/25 rounded-lg shadow-lg z-20 py-1">
                  <button
                    className="flex flex-row items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-zinc-700 dark:text-zinc-300"
                    onClick={() => { /* TODO: export PDF */ setMenuOpen(false); }}
                  >
                    <FileDown className="size-4 text-zinc-400" />
                    Esporta PDF
                  </button>
                  <button
                    className="flex flex-row items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-zinc-700 dark:text-zinc-300"
                    onClick={() => { /* TODO: export CSV */ setMenuOpen(false); }}
                  >
                    <FileSpreadsheet className="size-4 text-zinc-400" />
                    Esporta CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {!isLoading && clients.length === 0 ? (
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
        )}
      </div>
    </>
  );
}
