'use client';

import { useState, useEffect } from 'react';
import { TriangleAlert, Trash2, X, Archive } from 'lucide-react';
import { Modal } from '@/lib/components/shared/ui/modals/Modal';
import { useClientsStore } from '@/lib/stores/clients';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import type { Client } from '@/lib/types/Client';

interface DeleteClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClient: Client | null;
}

export function DeleteClientModal({ isOpen, onClose, selectedClient }: DeleteClientModalProps) {
  const deleteClient = useClientsStore((s) => s.deleteClient);
  const archiveClient = useClientsStore((s) => s.archiveClient);
  const [confirmInput, setConfirmInput] = useState('');

  const fullName = selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : '';
  const isConfirmed = confirmInput.trim().toLowerCase() === fullName.toLowerCase();
  const isArchived = selectedClient?.isArchived ?? false;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen) setConfirmInput('');
  }, [isOpen]);

  const handleClose = () => {
    setConfirmInput('');
    onClose();
  };

  const handleDelete = async () => {
    if (!selectedClient || !isConfirmed) return;
    try {
      await deleteClient(selectedClient.id);
      messagePopup.getState().success('Cliente eliminato con successo.');
      handleClose();
    } catch {
      messagePopup.getState().error("Errore durante l'eliminazione.");
    }
  };

  const handleArchive = async () => {
    if (!selectedClient) return;
    try {
      await archiveClient(selectedClient.id);
      messagePopup.getState().success('Cliente archiviato con successo.');
      handleClose();
    } catch {
      messagePopup.getState().error("Errore durante l'archiviazione.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} classes="max-w-lg" closeOnOutsideClick={false}>
      <div className="flex flex-col bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-xl w-full">

        {/* Header */}
        <div className="flex flex-row items-center justify-between p-6 border-b border-zinc-500/25">
          <div className="flex flex-row items-center gap-3 min-w-0">
            <div className="flex shrink-0 items-center justify-center size-10 rounded-lg bg-red-500/10">
              <TriangleAlert className="size-5 text-red-500" />
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Elimina cliente</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">Azione irreversibile — leggi attentamente</p>
            </div>
          </div>
          <button
            className="shrink-0 ml-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            onClick={handleClose}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4">
            <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
              <strong>Attenzione:</strong> eliminando <strong>{fullName}</strong> verranno cancellati
              permanentemente il cliente e <strong>tutte le fiche collegate</strong>.
              Questa operazione <strong>altererà irrimediabilmente il bilancio storico del salone</strong> e non
              potrà essere annullata in nessun modo.
            </p>
          </div>

          {!isArchived && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4">
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>Consiglio:</strong> usa <strong>Archivia</strong> per nascondere il cliente
                mantenendo intatto lo storico dati.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">
              Digita <strong className="text-zinc-900 dark:text-zinc-100 font-medium">{fullName}</strong> per confermare
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && isConfirmed) handleDelete(); }}
              placeholder={fullName}
              autoComplete="off"
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-row items-center justify-between gap-3 p-6 border-t border-zinc-500/25">
          <div>
            {!isArchived && (
              <button
                type="button"
                onClick={handleArchive}
                className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
              >
                <Archive className="size-4" />
                Archivia
              </button>
            )}
          </div>
          <div className="flex flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors text-zinc-900 dark:text-zinc-100"
            >
              <X className="size-4" />
              Annulla
            </button>
            <button
              type="button"
              disabled={!isConfirmed}
              onClick={handleDelete}
              className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-red-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-red-600"
            >
              <Trash2 className="size-4" />
              Elimina cliente
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
}
