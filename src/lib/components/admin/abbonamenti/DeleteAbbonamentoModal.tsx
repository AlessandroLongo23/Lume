'use client';

import { useAbbonamentiStore } from '@/lib/stores/abbonamenti';
import { useClientsStore } from '@/lib/stores/clients';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import { Callout } from '@/lib/components/shared/ui/Callout';
import type { Abbonamento } from '@/lib/types/Abbonamento';

interface DeleteAbbonamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  abbonamento: Abbonamento | null;
}

export function DeleteAbbonamentoModal({ isOpen, onClose, abbonamento }: DeleteAbbonamentoModalProps) {
  const deleteAbbonamento = useAbbonamentiStore((s) => s.deleteAbbonamento);
  const clients = useClientsStore((s) => s.clients);
  const client = abbonamento ? clients.find((c) => c.id === abbonamento.client_id) : null;
  const usedCount = abbonamento?.usedTreatments ?? 0;

  async function handleDelete() {
    if (!abbonamento) return;
    try {
      await deleteAbbonamento(abbonamento.id);
      messagePopup.getState().success('Abbonamento eliminato.');
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Errore durante l'eliminazione.";
      messagePopup.getState().error(msg);
    }
  }

  return (
    <DeleteModal isOpen={isOpen} onConfirm={handleDelete} onClose={onClose}>
      <p>
        Sei sicuro di voler eliminare l&apos;abbonamento
        {client ? <> di <strong>{client.firstName} {client.lastName}</strong></> : null}?
      </p>
      {usedCount > 0 && (
        <Callout tone="warning">
          <strong>{usedCount}</strong> sedute sono già state utilizzate. Eliminando
          l&apos;abbonamento, le fiches esistenti resteranno ma perderanno il collegamento.
        </Callout>
      )}
      <p className="text-[var(--lume-text-secondary)]">L&apos;azione è irreversibile.</p>
    </DeleteModal>
  );
}
