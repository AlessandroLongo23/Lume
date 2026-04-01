'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { ClientCard } from './ClientCard';
import { EditClientModal } from './EditClientModal';
import { DeleteClientModal } from './DeleteClientModal';
import type { Client } from '@/lib/types/Client';

interface ClientsGridProps {
  clients: Client[];
}

export function ClientsGrid({ clients }: ClientsGridProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editedClient, setEditedClient] = useState<Partial<Client>>({});

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setEditedClient({ ...client });
    setShowEdit(true);
  };

  const handleDelete = (client: Client) => {
    setSelectedClient(client);
    setShowDelete(true);
  };

  return (
    <div>
      {clients.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
          <Users className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mb-3" />
          <h3 className="text-lg font-medium text-zinc-600 dark:text-zinc-400 mb-1">Nessun cliente trovato</h3>
          <p className="text-sm text-zinc-500 text-center max-w-md">Non ci sono clienti registrati.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <EditClientModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        editedClient={editedClient}
        onEditedClientChange={setEditedClient}
        selectedClient={selectedClient}
      />
      <DeleteClientModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        selectedClient={selectedClient}
      />
    </div>
  );
}
