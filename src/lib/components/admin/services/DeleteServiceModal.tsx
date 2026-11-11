'use client';

import { useState } from 'react';
import { Archive } from 'lucide-react';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import { useServicesStore } from '@/lib/stores/services';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import type { Service } from '@/lib/types/Service';

interface DeleteServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedService: Service | null;
  onDeleted?: () => void;
}

export function DeleteServiceModal({ isOpen, onClose, selectedService, onDeleted }: DeleteServiceModalProps) {
  const deleteService = useServicesStore((s) => s.deleteService);
  const archiveService = useServicesStore((s) => s.archiveService);
  const fetchServices = useServicesStore((s) => s.fetchServices);
  const [busy, setBusy] = useState(false);
  const isArchived = selectedService?.isArchived ?? false;

  const handleDelete = async () => {
    if (!selectedService) return;
    setBusy(true);
    try {
      await deleteService(selectedService.id);
      await fetchServices();
      messagePopup.getState().success('Servizio eliminato.');
      onClose();
      onDeleted?.();
    } catch {
      messagePopup.getState().error("Errore durante l'eliminazione.");
    } finally {
      setBusy(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedService) return;
    try {
      await archiveService(selectedService.id);
      messagePopup.getState().success('Servizio archiviato con successo.');
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'archiviazione.");
    }
  };

  return (
    <DeleteModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      busy={busy}
      title="Elimina servizio"
      subtitle="Azione irreversibile: leggi con attenzione."
      confirmText="Elimina servizio"
      confirmPhrase={selectedService?.name ?? ''}
      warning={
        <>
          <strong>Attenzione:</strong> eliminando il servizio <strong>{selectedService?.name}</strong> verranno
          cancellati permanentemente il servizio e <strong>tutte le righe fiche collegate</strong>. Questa operazione{' '}
          <strong>non potrà essere annullata</strong>.
        </>
      }
      tip={!isArchived && (
        <>
          <strong>Consiglio:</strong> usa <strong>Archivia</strong> per nascondere il servizio mantenendo intatto lo
          storico dati.
        </>
      )}
      alternative={isArchived ? undefined : { label: 'Archivia', icon: Archive, onClick: handleArchive }}
    />
  );
}
