'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TriangleAlert, Trash2, X } from 'lucide-react';
import { Modal } from '@/lib/components/shared/ui/modals/Modal';
import { supabase } from '@/lib/supabase/client';

interface DeleteWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  salonName: string;
}

export function DeleteWorkspaceModal({ isOpen, onClose, salonName }: DeleteWorkspaceModalProps) {
  const router = useRouter();
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isConfirmed = confirmInput === salonName;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen) setConfirmInput('');
    if (isOpen) setErrorMsg(null);
  }, [isOpen]);

  const handleDelete = async () => {
    if (!isConfirmed || isDeleting) return;
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/workspaces/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed_name: salonName }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error ?? "Errore durante l'eliminazione. Riprova.");
        setIsDeleting(false);
        return;
      }

      // Sign out client-side then redirect — session is now gone
      await supabase.auth.signOut();
      router.replace('/login');
    } catch {
      setErrorMsg('Errore di rete. Controlla la connessione e riprova.');
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={isDeleting ? () => {} : onClose} classes="max-w-lg" closeOnOutsideClick={false}>
      <div className="flex flex-col bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-xl w-full">

        {/* Header */}
        <div className="flex flex-row items-center justify-between p-6 border-b border-zinc-500/25">
          <div className="flex flex-row items-center gap-3 min-w-0">
            <div className="flex shrink-0 items-center justify-center size-10 rounded-lg bg-red-500/10">
              <TriangleAlert className="size-5 text-red-500" />
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Elimina salone</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Azione irreversibile — leggi attentamente</p>
            </div>
          </div>
          {!isDeleting && (
            <button
              className="shrink-0 ml-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              onClick={onClose}
              aria-label="Chiudi"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4">
            <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
              <strong>Attenzione:</strong> eliminando il salone{' '}
              <strong>{salonName}</strong> verranno cancellati permanentemente{' '}
              <strong>tutti i clienti, le schede, i servizi, i prodotti, gli ordini e gli operatori</strong>{' '}
              associati a questo workspace. Il tuo account verrà disconnesso.{' '}
              Questa operazione <strong>non potrà essere annullata</strong>.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">
              Digita{' '}
              <strong className="text-zinc-900 dark:text-zinc-100 font-medium">
                {salonName}
              </strong>{' '}
              per confermare l&apos;eliminazione
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => { setConfirmInput(e.target.value); setErrorMsg(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && isConfirmed) handleDelete(); }}
              placeholder={salonName}
              autoComplete="off"
              disabled={isDeleting}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {errorMsg && (
            <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-row items-center justify-end gap-3 p-6 border-t border-zinc-500/25">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="size-4" />
            Annulla
          </button>
          <button
            type="button"
            disabled={!isConfirmed || isDeleting}
            onClick={handleDelete}
            className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-red-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-red-600"
          >
            <Trash2 className="size-4" />
            {isDeleting ? 'Eliminazione in corso...' : 'Conferma ed Elimina'}
          </button>
        </div>

      </div>
    </Modal>
  );
}
