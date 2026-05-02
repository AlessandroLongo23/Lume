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
  { value: 'M', label: 'Uomo' },
  { value: 'F', label: 'Donna' },
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
    <div className="flex-1 min-h-0 flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex items-center flex-1 max-w-sm">
          <Search className="absolute left-2.5 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Cerca cliente..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full py-2 pl-9 pr-8 text-sm bg-transparent border rounded-lg
              border-border focus:border-foreground/30
              text-foreground placeholder:text-muted-foreground
              outline-none transition-colors"
          />
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter('')}
              aria-label="Cancella ricerca"
              className="absolute right-2 p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <FacetedFilter label="Genere" options={GENDER_OPTIONS} selected={selectedGenders} onChange={setSelectedGenders} />
      </div>

      {filteredClients.length === 0 ? (
        <div className="min-h-[18.75rem] flex flex-col items-center justify-center p-8 bg-muted/40 rounded-lg border border-dashed border-border">
          <Users className="w-16 h-16 text-muted-foreground/60 mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">Nessun cliente trovato</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">Nessun cliente soddisfa i criteri di ricerca.</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto -mr-4 pr-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in pb-2">
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
