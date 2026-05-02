'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BadgePercent, Plus, Trash2 } from 'lucide-react';
import { useAbbonamentiStore } from '@/lib/stores/abbonamenti';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { DropdownMenu } from '@/lib/components/shared/ui/DropdownMenu';
import { DeleteAllModal } from '@/lib/components/shared/ui/modals/DeleteAllModal';
import { AbbonamentiTable } from '@/lib/components/admin/abbonamenti/AbbonamentiTable';
import { AddAbbonamentoModal } from '@/lib/components/admin/abbonamenti/AddAbbonamentoModal';
import { EditAbbonamentoModal } from '@/lib/components/admin/abbonamenti/EditAbbonamentoModal';
import { DeleteAbbonamentoModal } from '@/lib/components/admin/abbonamenti/DeleteAbbonamentoModal';
import type { Abbonamento } from '@/lib/types/Abbonamento';

export default function AbbonamentiPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const abbonamenti = useAbbonamentiStore((s) => s.abbonamenti);
  const isLoading = useAbbonamentiStore((s) => s.isLoading);
  const deleteAllAbbonamenti = useAbbonamentiStore((s) => s.deleteAllAbbonamenti);

  const [addOpen, setAddOpen] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [commandTarget, setCommandTarget] = useState<Abbonamento | null>(null);
  const [commandMode, setCommandMode] = useState<'edit' | 'delete' | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setAddOpen(true);
      router.replace('/admin/abbonamenti');
      return;
    }
    const editId = searchParams.get('edit');
    if (editId) {
      const abb = useAbbonamentiStore.getState().abbonamenti.find((a) => a.id === editId);
      if (abb) { setCommandTarget(abb); setCommandMode('edit'); }
      router.replace('/admin/abbonamenti');
      return;
    }
    const deleteId = searchParams.get('delete');
    if (deleteId) {
      const abb = useAbbonamentiStore.getState().abbonamenti.find((a) => a.id === deleteId);
      if (abb) { setCommandTarget(abb); setCommandMode('delete'); }
      router.replace('/admin/abbonamenti');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <>
      <AddAbbonamentoModal isOpen={addOpen} onClose={() => setAddOpen(false)} />
      <EditAbbonamentoModal
        isOpen={commandMode === 'edit'}
        onClose={() => { setCommandMode(null); setCommandTarget(null); }}
        abbonamento={commandTarget}
      />
      <DeleteAbbonamentoModal
        isOpen={commandMode === 'delete'}
        onClose={() => { setCommandMode(null); setCommandTarget(null); }}
        abbonamento={commandTarget}
      />
      <DeleteAllModal
        isOpen={showDeleteAll}
        onClose={() => setShowDeleteAll(false)}
        entityLabel="abbonamenti"
        count={abbonamenti.length}
        cascadeNotice={
          <>
            Verranno cancellati tutti gli abbonamenti dei clienti. I servizi delle fiche già
            registrate non risulteranno più collegati ad alcun abbonamento.
          </>
        }
        onConfirm={deleteAllAbbonamenti}
      />

      <div className="flex-1 min-h-0 flex flex-col gap-6">
        <PageHeader
          title="Abbonamenti"
          subtitle="Pacchetti prepagati per chi torna spesso."
          icon={BadgePercent}
          actions={
            <>
              <button
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                <Plus className="size-4" />
                Nuovo abbonamento
              </button>
              {abbonamenti.length > 0 && (
                <DropdownMenu items={[
                  { label: 'Elimina tutti', icon: Trash2, onClick: () => setShowDeleteAll(true), destructive: true },
                ]} />
              )}
            </>
          }
        />

        {isLoading ? (
          <TableSkeleton />
        ) : abbonamenti.length === 0 ? (
          <EmptyState
            icon={BadgePercent}
            title="Nessun abbonamento"
            description="Crea il primo pacchetto prepagato per i clienti che tornano spesso."
            action={{ label: 'Nuovo abbonamento', icon: Plus, onClick: () => setAddOpen(true) }}
          />
        ) : (
          <AbbonamentiTable abbonamenti={abbonamenti} />
        )}
      </div>
    </>
  );
}
