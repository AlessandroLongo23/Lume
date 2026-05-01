'use client';

import { useMemo, useState } from 'react';
import { Search, Users, X } from 'lucide-react';
import { ClientCard } from './ClientCard';
import { DeleteClientModal } from './DeleteClientModal';
import { FacetedFilter } from '@/lib/components/admin/table/FacetedFilter';
import { useClientsStore } from '@/lib/stores/clients';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import type { Client } from '@/lib/types/Client';

interface ClientsGridProps {
  clients: Client[];
  showArchived?: boolean;
}

const GENDER_OPTIONS = [
  { value: 'M', label: 'Uomo', prefix: <span className="text-xs font-semibold text-blue-500 mr-0.5">M</span> },
  { value: 'F', label: 'Donna', prefix: <span className="text-xs font-semibold text-pink-500 mr-0.5">F</span> },
];

export function ClientsGrid({ clients, showArchived = false }: ClientsGridProps) {
  const restoreClient = useClientsStore((s) => s.restoreClient);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);

  const filteredClients = useMemo(() => {
    let data = clients;
    if (selectedGenders.length > 0) data = data.filter((c) => selectedGenders.includes(c.gender));
    if (globalFilter.trim()) {
      const q = globalFilter.toLowerCase();
      data = data.filter((c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        `${c.phonePrefix ?? ''} ${c.phoneNumber ?? ''}`.toLowerCase().includes(q)
      );
    }
    return data;
  }, [clients, selectedGenders, globalFilter]);

  const handleDelete = (client: Client) => {
    setSelectedClient(client);
    setShowDelete(true);
  };

  const handleRestore = async (client: Client) => {
    try {
      await restoreClient(client.id);
      messagePopup.getState().success('Cliente ripristinato con successo.');
    } catch {
      messagePopup.getState().error('Errore durante il ripristino.');
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex items-center flex-1 max-w-sm">
          <Search className="absolute left-2.5 size-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cerca cliente..."
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
        <FacetedFilter label="Genere" options={GENDER_OPTIONS} selected={selectedGenders} onChange={setSelectedGenders} />
      </div>

      {filteredClients.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
          <Users className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mb-3" />
          <h3 className="text-lg font-medium text-zinc-600 dark:text-zinc-400 mb-1">Nessun cliente trovato</h3>
          <p className="text-sm text-zinc-500 text-center max-w-md">Nessun cliente soddisfa i criteri di ricerca.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onDelete={handleDelete}
              onRestore={handleRestore}
              showArchived={showArchived}
            />
          ))}
        </div>
      )}

      <DeleteClientModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        selectedClient={selectedClient}
      />
    </div>
  );
}
