'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import { Callout } from '@/lib/components/shared/ui/Callout';

interface DeletePlatformSalonModalProps {
  isOpen:    boolean;
  onClose:   () => void;
  salonId:   string;
  salonName: string;
}

export function DeletePlatformSalonModal({ isOpen, onClose, salonId, salonName }: DeletePlatformSalonModalProps) {
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
      const res = await fetch(`/api/platform/salons/${salonId}`, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ confirmed_name: salonName }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? "Errore durante l'eliminazione. Riprova.");
        setIsDeleting(false);
        return;
      }

      onClose();
      router.refresh();
    } catch {
      setErrorMsg('Errore di rete. Controlla la connessione e riprova.');
      setIsDeleting(false);
    }
  };

  // Type-to-confirm: the delete button stays disabled until the salon name is typed.
  return (
    <DeleteModal
      isOpen={isOpen}
      onClose={isDeleting ? () => {} : onClose}
      onConfirm={handleDelete}
      title="Elimina salone dalla piattaforma"
      subtitle="L'eliminazione non si può annullare."
      warning={
        <>
          <p>
            Eliminando il salone <span className="font-medium text-[var(--lume-text)]">{salonName}</span>{' '}
            verranno cancellati per sempre{' '}
            <span className="font-medium text-[var(--lume-text)]">tutti i clienti, le schede, i servizi, i prodotti, gli ordini, i coupon e gli operatori</span>{' '}
            associati a questo salone. Se il titolare non possiede altri saloni, anche il suo account verrà rimosso.
          </p>
          <p className="mt-2">I clienti e gli operatori condivisi con altri saloni restano negli altri saloni.</p>
        </>
      }
      confirmPhrase={salonName}
      confirmText={isDeleting ? 'Eliminazione in corso…' : 'Elimina salone'}
      busy={isDeleting}
    >
      {errorMsg && <Callout tone="danger">{errorMsg}</Callout>}
    </DeleteModal>
  );
}
