'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trash2, Mail, Phone, UserX, Archive, ArchiveRestore, Link2 } from 'lucide-react';
import { useOperatorsStore } from '@/lib/stores/operators';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { trackRecent } from '@/lib/components/shell/commandMenu/recents';
import {
  DetailHero,
  DetailSection,
  DetailHeroActions,
  DetailChip,
  HeroAvatar,
  ContactRow,
} from '@/lib/components/shared/ui/detail';
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
      messagePopup.getState().error("Errore durante l'operazione.");
    }
  };

  useEffect(() => {
    if (!isLoading) {
      const found = operators.find((o) => o.id === operatorId);
      if (found) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOperator(found);
      } else {
        setError('Operatore non trovato');
      }
    }
  }, [operators, operatorId, isLoading]);

  useEffect(() => {
    if (!operator) return;
    const fullName = `${operator.firstName ?? ''} ${operator.lastName ?? ''}`.trim() || 'Operatore';
    trackRecent({
      type: 'operator',
      id: operator.id,
      label: fullName,
      subtitle: operator.email ?? operator.phoneNumber ?? undefined,
      href: `/admin/operatori/${operator.id}`,
    });
  }, [operator]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-16 h-16 border-4 border-zinc-500/25 border-t-primary rounded-full animate-spin" />
        <p className="mt-4 text-zinc-500 dark:text-zinc-400">Caricamento...</p>
      </div>
    );
  }

  if (error || !operator) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <UserX className="size-16 text-zinc-300 dark:text-zinc-600 mb-4" strokeWidth={1.5} />
        <h2 className="text-xl font-semibold text-zinc-700 dark:text-zinc-200 mb-2">Operatore non trovato</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{error ?? "L'operatore non esiste o è stato rimosso."}</p>
        <button
          className="mt-6 px-4 py-2 text-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-md transition-colors"
          onClick={() => router.push('/admin/operatori')}
        >
          Torna alla lista operatori
        </button>
      </div>
    );
  }

  const initials = `${operator.firstName?.[0] ?? ''}${operator.lastName?.[0] ?? ''}`.toUpperCase();
  const linkedToUser = !!operator.user_id;
  const hasEmail = !!operator.email;
  const hasPhone = !!(operator.phonePrefix && operator.phoneNumber);

  return (
    <>
      <EditOperatorModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        selectedOperator={operator}
        editedOperator={editedOperator}
        onEditedOperatorChange={setEditedOperator}
      />
      <DeleteOperatorModal isOpen={showDelete} onClose={() => setShowDelete(false)} selectedOperator={operator} />

      <div className="flex flex-col">
        <DetailHero
          onBack={() => router.push('/admin/operatori')}
          avatar={<HeroAvatar initials={initials} />}
          title={`${operator.firstName} ${operator.lastName}`}
          chips={
            <>
              {operator.isArchived && <DetailChip tone="amber">Archiviato</DetailChip>}
              {linkedToUser && (
                <DetailChip tone="primary" icon={Link2}>
                  Account collegato
                </DetailChip>
              )}
            </>
          }
          meta={<span>Operatore</span>}
          actions={
            <DetailHeroActions
              isEditing={false}
              isLocked={operator.isArchived}
              onEdit={() => { setEditedOperator(operator); setShowEdit(true); }}
              onCancel={() => {}}
              onSave={() => {}}
              menuItems={[
                {
                  label: operator.isArchived ? 'Ripristina' : 'Archivia',
                  icon: operator.isArchived ? ArchiveRestore : Archive,
                  onClick: handleToggleArchive,
                },
                { label: 'Elimina', icon: Trash2, onClick: () => setShowDelete(true) },
              ]}
            />
          }
        />

        <div className="px-6 lg:px-10 py-8 max-w-5xl w-full mx-auto flex flex-col gap-12">
          <DetailSection index={0} label="Contatti">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-zinc-500/15 bg-zinc-50/60 dark:bg-zinc-900/40 px-5 py-4 flex flex-col gap-2">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Email</span>
                {hasEmail ? (
                  <ContactRow
                    icon={Mail}
                    value={operator.email}
                    emptyLabel="—"
                    onCopy={(v) => {
                      navigator.clipboard.writeText(v);
                      messagePopup.getState().success('Email copiata negli appunti');
                    }}
                  />
                ) : (
                  <span className="text-sm text-zinc-400 dark:text-zinc-500 italic">Nessuna email</span>
                )}
              </div>
              <div className="rounded-xl border border-zinc-500/15 bg-zinc-50/60 dark:bg-zinc-900/40 px-5 py-4 flex flex-col gap-2">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Telefono</span>
                {hasPhone ? (
                  <ContactRow
                    icon={Phone}
                    value={`${operator.phonePrefix} ${operator.phoneNumber}`}
                    emptyLabel="—"
                    onCopy={(v) => {
                      navigator.clipboard.writeText(v.replace(/\s+/g, ''));
                      messagePopup.getState().success('Numero copiato negli appunti');
                    }}
                  />
                ) : (
                  <span className="text-sm text-zinc-400 dark:text-zinc-500 italic">Nessun telefono</span>
                )}
              </div>
            </div>
          </DetailSection>
        </div>
      </div>
    </>
  );
}
