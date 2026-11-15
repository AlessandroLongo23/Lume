'use client';

import { useState } from 'react';
import { Archive } from 'lucide-react';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import { useOperatorsStore } from '@/lib/stores/operators';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import type { Operator } from '@/lib/types/Operator';

interface DeleteOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOperator: Operator | null;
}

export function DeleteOperatorModal({ isOpen, onClose, selectedOperator }: DeleteOperatorModalProps) {
  const deleteOperator = useOperatorsStore((s) => s.deleteOperator);
  const archiveOperator = useOperatorsStore((s) => s.archiveOperator);
  const [busy, setBusy] = useState(false);

  const fullName = selectedOperator ? `${selectedOperator.firstName} ${selectedOperator.lastName}` : '';
  const isArchived = selectedOperator?.archived_at !== null;

  const handleDelete = async () => {
    if (!selectedOperator) return;
    setBusy(true);
    try {
      await deleteOperator(selectedOperator.id);
      messagePopup.getState().success('Operatore eliminato definitivamente.');
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'eliminazione.");
    } finally {
      setBusy(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedOperator) return;
    try {
      await archiveOperator(selectedOperator.id);
      messagePopup.getState().success('Operatore archiviato con successo.');
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
      title="Elimina operatore"
      subtitle="Azione irreversibile: leggi con attenzione."
      confirmText="Elimina operatore"
      confirmPhrase={fullName}
      warning={
        <>
          <strong>Attenzione:</strong> eliminando <strong>{fullName}</strong> verranno cancellati permanentemente il
          profilo operatore e <strong>tutti i dati collegati</strong>: appuntamenti, fiches, storico presenze e
          statistiche. Questa operazione <strong>non potrà essere annullata in nessun modo</strong>.
        </>
      }
      tip={!isArchived && (
        <>
          <strong>Consiglio:</strong> usa <strong>Archivia</strong>{' '}
          per nascondere l&apos;operatore mantenendo intatto lo storico dati.
        </>
      )}
      alternative={isArchived ? undefined : { label: 'Archivia', icon: Archive, onClick: handleArchive }}
    />
  );
}
