'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, User, Calendar, Check, FileText } from 'lucide-react';
import { useFichesStore } from '@/lib/stores/fiches';
import { useClientsStore } from '@/lib/stores/clients';
import { EditFicheModal } from '@/lib/components/admin/fiches/EditFicheModal';
import { DeleteFicheModal } from '@/lib/components/admin/fiches/DeleteFicheModal';
import type { Fiche } from '@/lib/types/Fiche';

export default function FicheDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fiches = useFichesStore((s) => s.fiches);
  const isLoading = useFichesStore((s) => s.isLoading);
  const clients = useClientsStore((s) => s.clients);

  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editedFiche, setEditedFiche] = useState<Partial<Fiche>>({});

  const ficheId = params.id as string;

  useEffect(() => {
    if (!isLoading) {
      const found = fiches.find((f) => f.id === ficheId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (found) setFiche(found);
    }
  }, [fiches, ficheId, isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-16 h-16 border-4 border-zinc-500/25 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!fiche) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <h2 className="text-xl font-bold">Fiche non trovata</h2>
        <button className="mt-4 px-4 py-2 bg-zinc-200 rounded-md" onClick={() => router.push('/admin/fiches')}>Torna indietro</button>
      </div>
    );
  }

  const client = clients.find((c) => c.id === fiche.client_id);

  return (
    <>
      <EditFicheModal isOpen={showEdit} onClose={() => setShowEdit(false)} selectedFiche={fiche} editedFiche={editedFiche} onEditedFicheChange={setEditedFiche} />
      <DeleteFicheModal isOpen={showDelete} onClose={() => setShowDelete(false)} selectedFiche={fiche} />

      <div className="flex flex-col gap-4 max-w-2xl">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/fiches')} className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors">
            <ArrowLeft className="size-5 text-zinc-600 dark:text-zinc-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Fiche #{fiche.id.slice(0, 8)}</h1>
            <p className="text-sm text-zinc-500">Dettagli fiche</p>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => { setEditedFiche(fiche); setShowEdit(true); }} className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 rounded-md">
              <Edit className="size-5 text-zinc-600 dark:text-zinc-300" />
            </button>
            <button onClick={() => setShowDelete(true)} className="p-2 bg-zinc-100 hover:bg-red-100 dark:bg-zinc-800 rounded-md">
              <Trash2 className="size-5 text-zinc-600 dark:text-zinc-300" />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-500/25 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <User className="size-4 text-zinc-500" />
            <span className="text-sm text-zinc-500">Cliente</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{client?.getFullName() ?? fiche.client_id}</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="size-4 text-zinc-500" />
            <span className="text-sm text-zinc-500">Data e ora</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{new Date(fiche.datetime).toLocaleString('it-IT')}</span>
          </div>
          <div className="flex items-center gap-3">
            <Check className="size-4 text-zinc-500" />
            <span className="text-sm text-zinc-500">Stato</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{fiche.status}</span>
          </div>
          {fiche.note && (
            <div className="flex items-start gap-3 col-span-full">
              <FileText className="size-4 text-zinc-500 mt-0.5" />
              <div>
                <span className="text-sm text-zinc-500">Nota</span>
                <p className="text-sm text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">{fiche.note}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
