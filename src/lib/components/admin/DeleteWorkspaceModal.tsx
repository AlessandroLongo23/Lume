'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import { Callout } from '@/lib/components/shared/ui/Callout';
import { supabase } from '@/lib/supabase/client';

interface DeleteWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  salonName: string;
}

export function DeleteWorkspaceModal({ isOpen, onClose, salonName }: DeleteWorkspaceModalProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen) setErrorMsg(null);
  }, [isOpen]);

  const handleDelete = async () => {
    if (isDeleting) return;
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

  // Type-to-confirm: the delete button stays disabled until the salon name is typed.
  return (
    <DeleteModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Elimina salone"
      subtitle="Azione irreversibile: leggi con attenzione."
      warning={
        <>
          Eliminando il salone <span className="font-medium">{salonName}</span> verranno cancellati
          definitivamente tutti i clienti, le schede, i servizi, i prodotti, gli ordini e gli operatori
          associati a questo salone. Il tuo account verrà disconnesso. Questa operazione non potrà essere
          annullata.
        </>
      }
      confirmPhrase={salonName}
      confirmText="Elimina salone"
      busy={isDeleting}
    >
      {errorMsg && <Callout tone="danger">{errorMsg}</Callout>}
    </DeleteModal>
  );
}
