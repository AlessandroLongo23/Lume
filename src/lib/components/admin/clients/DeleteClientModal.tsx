'use client';

import { useState } from 'react';
import { Archive } from 'lucide-react';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import { useClientsStore } from '@/lib/stores/clients';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import type { Client } from '@/lib/types/Client';

interface DeleteClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClient: Client | null;
  onDeleted?: () => void;
}

export function DeleteClientModal({ isOpen, onClose, selectedClient, onDeleted }: DeleteClientModalProps) {
  const deleteClient = useClientsStore((s) => s.deleteClient);
  const archiveClient = useClientsStore((s) => s.archiveClient);
  const [busy, setBusy] = useState(false);

  const fullName = selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : '';
  const isArchived = selectedClient?.isArchived ?? false;

  const handleDelete = async () => {
    if (!selectedClient) return;
    setBusy(true);
    try {
      await deleteClient(selectedClient.id);
      messagePopup.getState().success('Cliente eliminato con successo.');
      onClose();
      onDeleted?.();
    } catch {
      messagePopup.getState().error("Errore durante l'eliminazione.");
    } finally {
      setBusy(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedClient) return;
    setBusy(true);
    try {
      await archiveClient(selectedClient.id);
      messagePopup.getState().success('Cliente archiviato con successo.');
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'archiviazione.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DeleteModal
      // Remount per client so the type-to-confirm text never carries over.
      key={selectedClient?.id ?? 'none'}
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Elimina cliente"
      subtitle="Azione irreversibile — leggi attentamente"
      confirmText="Elimina cliente"
      confirmPhrase={fullName}
      busy={busy}
      warning={
        <>
          <strong className="font-medium text-[var(--lume-text)]">Attenzione:</strong> eliminando{' '}
          <strong className="font-medium text-[var(--lume-text)]">{fullName}</strong> verranno cancellati
          permanentemente il cliente e <strong className="font-medium text-[var(--lume-text)]">tutte le fiche collegate</strong>.
          Questa operazione <strong className="font-medium text-[var(--lume-text)]">altererà irrimediabilmente il bilancio storico del salone</strong> e non
          potrà essere annullata in nessun modo.
        </>
      }
      tip={!isArchived ? (
        <>
          <strong className="font-medium text-[var(--lume-text)]">Consiglio:</strong> usa{' '}
          <strong className="font-medium text-[var(--lume-text)]">Archivia</strong> per nascondere il cliente
          mantenendo intatto lo storico dati.
        </>
      ) : undefined}
      alternative={!isArchived ? { label: 'Archivia', icon: Archive, onClick: handleArchive } : undefined}
    />
  );
}
