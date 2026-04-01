'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Mail, Phone, UserX, Archive, ArchiveRestore } from 'lucide-react';
import { useOperatorsStore } from '@/lib/stores/operators';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { EditOperatorModal } from '@/lib/components/admin/operators/EditOperatorModal';
import { DeleteOperatorModal } from '@/lib/components/admin/operators/DeleteOperatorModal';
import type { Operator } from '@/lib/types/Operator';

export default function OperatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const operators = useOperatorsStore((s) => s.operators);
  const isLoading = useOperatorsStore((s) => s.isLoading);
  const archiveOperator = useOperatorsStore((s) => s.archiveOperator);
  const restoreOperator = useOperatorsStore((s) => s.restoreOperator);

  const [operator, setOperator] = useState<Operator | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editedOperator, setEditedOperator] = useState<Partial<Operator>>({});

  const operatorId = params.id as string;

  const handleToggleArchive = async () => {
    if (!operator) return;
    try {
      if (operator.isArchived) {
        await restoreOperator(operator.id);
        messagePopup.getState().success('Operatore ripristinato.');
      } else {
        await archiveOperator(operator.id);
        messagePopup.getState().success('Operatore archiviato.');
        router.push('/admin/operatori');
      }
    } catch {
      messagePopup.getState().error('Errore durante l\'operazione.');
    }
  };

  useEffect(() => {
    if (!isLoading) {
      const found = operators.find((o) => o.id === operatorId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (found) setOperator(found);
      else setError('Operatore non trovato');
    }
  }, [operators, operatorId, isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-16 h-16 border-4 border-zinc-500/25 border-t-teal-500 rounded-full animate-spin" />
        <p className="mt-4 text-zinc-500 dark:text-zinc-400">Caricamento...</p>
      </div>
    );
  }

  if (error || !operator) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
        <UserX className="size-16 text-zinc-400 mb-4" />
        <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-300 mb-2">Operatore non trovato</h2>
        <button className="mt-6 px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 rounded-md" onClick={() => router.push('/admin/operatori')}>
          Torna alla lista operatori
        </button>
      </div>
    );
  }

  return (
    <>
      <EditOperatorModal isOpen={showEdit} onClose={() => setShowEdit(false)} selectedOperator={operator} editedOperator={editedOperator} onEditedOperatorChange={setEditedOperator} />
      <DeleteOperatorModal isOpen={showDelete} onClose={() => setShowDelete(false)} selectedOperator={operator} />

      <div className="flex flex-col gap-4 max-w-2xl">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/operatori')} className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors">
            <ArrowLeft className="size-5 text-zinc-600 dark:text-zinc-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{operator.firstName} {operator.lastName}</h1>
            <p className="text-sm text-zinc-500">Dettagli operatore</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-500/25 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="size-20 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
              <span className="text-2xl font-bold text-teal-600 dark:text-teal-300">
                {operator.firstName?.[0]}{operator.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{operator.firstName} {operator.lastName}</h2>
                {operator.isArchived && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">Archiviato</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!operator.isArchived && (
                <button onClick={() => { setEditedOperator(operator); setShowEdit(true); }} className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 rounded-md transition-colors">
                  <Edit className="size-5 text-zinc-600 dark:text-zinc-300" />
                </button>
              )}
              <button
                onClick={handleToggleArchive}
                className="p-2 bg-zinc-100 hover:bg-amber-100 dark:bg-zinc-800 dark:hover:bg-amber-900/30 rounded-md transition-colors"
                title={operator.isArchived ? 'Ripristina operatore' : 'Archivia operatore'}
              >
                {operator.isArchived ? <ArchiveRestore className="size-5 text-zinc-600 dark:text-zinc-300" /> : <Archive className="size-5 text-zinc-600 dark:text-zinc-300" />}
              </button>
              <button onClick={() => setShowDelete(true)} className="p-2 bg-zinc-100 hover:bg-red-100 dark:bg-zinc-800 dark:hover:bg-red-900/30 rounded-md transition-colors">
                <Trash2 className="size-5 text-zinc-600 dark:text-zinc-300" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <Mail className="size-4 text-zinc-500" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{operator.email || 'Nessuna email'}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <Phone className="size-4 text-zinc-500" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{operator.phonePrefix && operator.phoneNumber ? `${operator.phonePrefix} ${operator.phoneNumber}` : 'Nessun telefono'}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
