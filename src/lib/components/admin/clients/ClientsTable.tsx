'use client';

import { useState } from 'react';
import { useClientsStore } from '@/lib/stores/clients';
import { Client } from '@/lib/types/Client';
import { Table } from '@/lib/components/admin/table/Table';
import { EditClientModal } from './EditClientModal';
import { DeleteClientModal } from './DeleteClientModal';

interface ClientsTableProps {
  clients: Client[];
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const isLoading = useClientsStore((s) => s.isLoading);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editedClient, setEditedClient] = useState<Partial<Client>>({});

  const handleEditClick = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setSelectedClient(client);
    setEditedClient({ ...client });
    setShowEdit(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setSelectedClient(client);
    setShowDelete(true);
  };

  return (
    <>
      <Table
        columns={Client.dataColumns}
        data={clients}
        handleEditClick={handleEditClick}
        handleDeleteClick={handleDeleteClick}
        detailPageUrl="clienti"
        isLoading={isLoading}
        labelPlural="clienti"
        labelSingular="cliente"
      />
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
    </>
  );
}
