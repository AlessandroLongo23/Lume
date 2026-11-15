'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trash2, Mail, Phone, UserX, Archive, ArchiveRestore, Link2, KeyRound, Clock, Send, XCircle } from 'lucide-react';
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
import { AddOperatorCredentialsModal } from '@/lib/components/admin/operators/AddOperatorCredentialsModal';
import { OperatorWorkingHoursPanel } from '@/lib/components/admin/operators/OperatorWorkingHoursPanel';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { canManageSalon } from '@/lib/auth/roles';
import type { Operator } from '@/lib/types/Operator';

export default function OperatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const operators = useOperatorsStore((s) => s.operators);
  const isLoading = useOperatorsStore((s) => s.isLoading);
  const archiveOperator = useOperatorsStore((s) => s.archiveOperator);
  const restoreOperator = useOperatorsStore((s) => s.restoreOperator);
  const pendingInvites = useOperatorsStore((s) => s.pendingInvites);
  const fetchPendingInvites = useOperatorsStore((s) => s.fetchPendingInvites);
  const role = useSubscriptionStore((s) => s.role);
  const canEdit = canManageSalon(role);

  const [operator, setOperator] = useState<Operator | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAddCredentials, setShowAddCredentials] = useState(false);
  const [editedOperator, setEditedOperator] = useState<Partial<Operator>>({});

  const pendingInvite = operator
    ? (pendingInvites.find(
        (inv) => operator.email && inv.email.toLowerCase() === operator.email!.toLowerCase(),
      ) ?? null)
    : null;

  const operatorId = params.id as string;

  const handleReinvite = async () => {
    if (!operator) return;
    try {
      const res = await fetch('/api/memberships/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorId: operator.id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      messagePopup.getState().success('Invito inviato nuovamente.');
      await fetchPendingInvites();
    } catch (err) {
      messagePopup.getState().error(err instanceof Error ? err.message : 'Errore.');
    }
  };

  const handleRevokeInvite = async () => {
    if (!pendingInvite) return;
    try {
      const res = await fetch('/api/memberships/invite', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId: pendingInvite.id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      messagePopup.getState().success('Invito revocato.');
      await fetchPendingInvites();
    } catch (err) {
      messagePopup.getState().error(err instanceof Error ? err.message : 'Errore.');
    }
  };

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
        <div className="size-8 border-2 border-active border-t-[var(--lume-text-secondary)] rounded-full animate-spin motion-reduce:animate-none" />
        <p className="mt-4 text-[var(--lume-text-secondary)]">Caricamento...</p>
      </div>
    );
  }

  if (error || !operator) {
    return (
      <div className="p-6">
        <EmptyState
          icon={UserX}
          title="Operatore non trovato"
          description="L'operatore non esiste o è stato rimosso."
          secondaryAction={{ label: 'Torna alla lista operatori', onClick: () => router.push('/admin/operatori') }}
        />
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
      <AddOperatorCredentialsModal
        isOpen={showAddCredentials}
        onClose={() => setShowAddCredentials(false)}
        operator={operator}
      />

      <div className="flex flex-col">
        <DetailHero
          onBack={() => router.push('/admin/operatori')}
          avatar={<HeroAvatar initials={initials} />}
          title={`${operator.firstName} ${operator.lastName}`}
          chips={
            <>
              {operator.isArchived && <DetailChip tone="warning">Archiviato</DetailChip>}
              {linkedToUser && (
                <DetailChip tone="accent" icon={Link2}>
                  Account collegato
                </DetailChip>
              )}
              {pendingInvite && !operator.isArchived && (
                <DetailChip tone="warning" icon={Clock}>
                  Invito in attesa
                </DetailChip>
              )}
              {!linkedToUser && !operator.isArchived && canEdit && (
                <DetailChip
                  icon={KeyRound}
                  onClick={() => setShowAddCredentials(true)}
                  title="Crea le credenziali per consentire all'operatore di accedere"
                >
                  Senza account · Aggiungi credenziali
                </DetailChip>
              )}
              {!linkedToUser && (operator.isArchived || !canEdit) && (
                <DetailChip icon={KeyRound}>
                  Senza account
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
                ...(pendingInvite && canEdit
                  ? [
                      {
                        label: 'Invia di nuovo l\'invito',
                        icon: Send,
                        onClick: handleReinvite,
                      },
                      {
                        label: 'Revoca invito',
                        icon: XCircle,
                        onClick: handleRevokeInvite,
                      },
                    ]
                  : []),
                {
                  label: operator.isArchived ? 'Ripristina' : 'Archivia',
                  icon: operator.isArchived ? ArchiveRestore : Archive,
                  onClick: handleToggleArchive,
                },
                { label: 'Elimina', icon: Trash2, onClick: () => setShowDelete(true), destructive: true },
              ]}
            />
          }
        />

        <div className="px-6 lg:px-10 py-8 max-w-5xl w-full mx-auto flex flex-col gap-12">
          <DetailSection index={0} label="Contatti">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="surface-card px-5 py-4 flex flex-col gap-2">
                <span className="text-xs font-medium text-[var(--lume-text-secondary)]">Email</span>
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
                  <span className="text-sm text-[var(--lume-text-muted)] italic">Nessuna email</span>
                )}
              </div>
              <div className="surface-card px-5 py-4 flex flex-col gap-2">
                <span className="text-xs font-medium text-[var(--lume-text-secondary)]">Telefono</span>
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
                  <span className="text-sm text-[var(--lume-text-muted)] italic">Nessun telefono</span>
                )}
              </div>
            </div>
          </DetailSection>

          <DetailSection index={1} label="Orari di lavoro">
            <OperatorWorkingHoursPanel
              operator={operator}
              readOnly={!canEdit || operator.isArchived}
            />
          </DetailSection>
        </div>
      </div>
    </>
  );
}
