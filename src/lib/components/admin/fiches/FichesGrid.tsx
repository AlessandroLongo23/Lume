'use client';

import { useState, useMemo } from 'react';
import { Calendar, Search, X } from 'lucide-react';
import { FicheCard } from './FicheCard';
import { EditFicheModal } from '@/lib/components/admin/calendar/EditFicheModal';
import { DeleteFicheModal } from './DeleteFicheModal';
import { FicheStatus } from '@/lib/types/ficheStatus';
import { useClientsStore } from '@/lib/stores/clients';
import type { Fiche } from '@/lib/types/Fiche';

interface FichesGridProps {
  fiches: Fiche[];
}

export function FichesGrid({ fiches }: FichesGridProps) {
  const clients = useClientsStore((s) => s.clients);

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedFiche, setSelectedFiche] = useState<Fiche | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const activeCount = useMemo(
    () => fiches.filter((f) => f.status !== FicheStatus.COMPLETED).length,
    [fiches]
  );
  const completedCount = useMemo(
    () => fiches.filter((f) => f.status === FicheStatus.COMPLETED).length,
    [fiches]
  );

  const filteredFiches = useMemo(() => {
    let data = fiches.filter((f) =>
      activeTab === 'active'
        ? f.status !== FicheStatus.COMPLETED
        : f.status === FicheStatus.COMPLETED
    );
    if (globalFilter.trim()) {
      const q = globalFilter.toLowerCase();
      data = data.filter((f) => {
        const client = clients.find((c) => c.id === f.client_id);
        const fullName = client ? `${client.firstName} ${client.lastName}`.toLowerCase() : '';
        return fullName.includes(q);
      });
    }
    return data;
  }, [fiches, activeTab, globalFilter, clients]);

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('active')}
          className={[
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'active'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
          ].join(' ')}
        >
          In Corso ({activeCount})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={[
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'completed'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
          ].join(' ')}
        >
          Completate ({completedCount})
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex items-center flex-1 max-w-sm">
          <Search className="absolute left-2.5 size-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cerca fiche..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full py-2 pl-9 pr-8 text-sm bg-transparent border rounded-lg
              border-zinc-200 dark:border-zinc-800
              focus:border-zinc-300 dark:focus:border-zinc-700
              text-zinc-900 dark:text-zinc-100
              placeholder:text-zinc-400 outline-none transition-colors"
          />
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter('')}
              className="absolute right-2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filteredFiches.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
          <Calendar className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mb-3" />
          <h3 className="text-lg font-medium text-zinc-600 dark:text-zinc-400">Nessuna fiche trovata</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiches.map((fiche) => (
            <FicheCard
              key={fiche.id}
              fiche={fiche}
              onEdit={(f) => { setSelectedFiche(f); setShowEdit(true); }}
              onDelete={(f) => { setSelectedFiche(f); setShowDelete(true); }}
            />
          ))}
        </div>
      )}

      <EditFicheModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        fiche={selectedFiche}
      />
      <DeleteFicheModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        selectedFiche={selectedFiche}
      />
    </div>
  );
}
