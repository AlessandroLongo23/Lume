'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { format, parse, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Trash2, Mail, Phone, UserX, Archive, ArchiveRestore, Gift, CreditCard, Plane } from 'lucide-react';
import { useClientsStore } from '@/lib/stores/clients';
import { useClientRatingsStore } from '@/lib/stores/client_ratings';
import { useCouponsStore } from '@/lib/stores/coupons';
import { trackRecent } from '@/lib/components/shell/commandMenu/recents';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { ConfirmDialog } from '@/lib/components/shared/ui/modals/ConfirmDialog';
import {
  DetailHero,
  DetailSection,
  DetailHeroActions,
  DetailChip,
  HeroAvatar,
  ContactRow,
  StatTile,
  SegmentedBar,
} from '@/lib/components/shared/ui/detail';
import { DeleteClientModal } from '@/lib/components/admin/clients/DeleteClientModal';
import { ClientForm, validateBirthDate, type ClientFormValue, type ClientFormErrors } from '@/lib/components/admin/clients/ClientForm';
import { TreatmentHistory } from '@/lib/components/admin/clients/TreatmentHistory';
import type { Client } from '@/lib/types/Client';

const STAR_TO_PERCENTILE: Record<number, string> = {
  5: 'Top 20%',
  4: 'Top 40%',
  3: 'Top 60%',
  2: 'Top 80%',
  1: 'Bottom 20%',
};

function formatEur(amount: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}

function clientToDraft(client: Client): ClientFormValue {
  const birthDate = client.birthDate
    ? (() => {
        const d = new Date(client.birthDate);
        return isValid(d) ? format(d, 'dd/MM/yyyy') : '';
      })()
    : '';
  return {
    firstName: client.firstName,
    lastName: client.lastName,
    gender: client.gender,
    email: client.email ?? '',
    phonePrefix: client.phonePrefix ?? '+39',
    phoneNumber: client.phoneNumber ?? '',
    password: '',
    birthDate,
    isTourist: client.isTourist,
  };
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clients = useClientsStore((s) => s.clients);
  const isLoading = useClientsStore((s) => s.isLoading);
  const updateClient = useClientsStore((s) => s.updateClient);
  const updateClientContact = useClientsStore((s) => s.updateClientContact);
  const archiveClient = useClientsStore((s) => s.archiveClient);
  const restoreClient = useClientsStore((s) => s.restoreClient);
  const rating = useClientRatingsStore((s) => (params.id ? s.ratings[params.id as string] : undefined));
  const allCoupons = useCouponsStore((s) => s.coupons);

  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ClientFormValue>({});
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState<{ action: () => void } | null>(null);

  const clientId = params.id as string;

  const hadEmail = !!client?.email;
  const hadPhone = !!(client?.phonePrefix && client?.phoneNumber);

  const isDirty = useMemo(() => {
    if (!isEditing || !client) return false;
    const baseline = clientToDraft(client);
    const keys: (keyof ClientFormValue)[] = ['firstName', 'lastName', 'gender', 'email', 'phonePrefix', 'phoneNumber', 'password', 'birthDate', 'isTourist'];
    return keys.some((k) => (draft[k] ?? '') !== (baseline[k] ?? ''));
  }, [isEditing, draft, client]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  useEffect(() => {
    if (!isLoading) {
      const found = clients.find((c) => c.id === clientId);
      if (found) {
        setClient(found);
      } else {
        setError('Cliente non trovato');
      }
    }
  }, [clients, clientId, isLoading]);

  useEffect(() => {
    if (!client) return;
    const fullName = `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim() || 'Cliente';
    trackRecent({
      type: 'client',
      id: client.id,
      label: fullName,
      subtitle: client.email ?? client.phoneNumber ?? undefined,
      href: `/admin/clienti/${client.id}`,
    });
  }, [client]);

  // Auto-enter edit mode when arrived via "Modifica X" command (?edit=<id>).
  useEffect(() => {
    if (!client) return;
    if (searchParams.get('edit') !== client.id) return;
    setDraft(clientToDraft(client));
    setErrors({});
    setIsEditing(true);
    router.replace(`/admin/clienti/${client.id}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only respond when client lands or query changes; intentionally excludes router.
  }, [client, searchParams]);

  // Scroll to the Scheda tecnica section when arrived via #scheda anchor.
  useEffect(() => {
    if (!client || isEditing) return;
    if (typeof window === 'undefined' || window.location.hash !== '#scheda') return;
    const el = document.getElementById('scheda');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [client, isEditing]);

  const handleEnterEdit = () => {
    if (!client) return;
    setDraft(clientToDraft(client));
    setErrors({});
    setIsEditing(true);
  };

  const exitEditMode = () => {
    setIsEditing(false);
    setDraft({});
    setErrors({});
  };

  const handleCancel = () => {
    if (isDirty) {
      setDiscardConfirm({ action: exitEditMode });
      return;
    }
    exitEditMode();
  };

  const handleBack = () => {
    const goBack = () => router.push('/admin/clienti');
    if (isEditing && isDirty) {
      setDiscardConfirm({ action: goBack });
      return;
    }
    goBack();
  };

  const handleSave = async () => {
    if (!client) return;

    const newErrors: ClientFormErrors = {};
    if (!draft.firstName?.trim()) newErrors.firstName = 'Inserisci un nome';
    if (!draft.lastName?.trim()) newErrors.lastName = 'Inserisci un cognome';
    if (draft.birthDate) {
      const err = validateBirthDate(draft.birthDate);
      if (err) newErrors.birthDate = err;
    }
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      messagePopup.getState().error('Correggi gli errori nel form');
      return;
    }

    let formattedBirthDate: string | null = null;
    if (draft.birthDate) {
      const parsed = parse(draft.birthDate, 'dd/MM/yyyy', new Date());
      if (isValid(parsed)) formattedBirthDate = format(parsed, 'yyyy-MM-dd');
    }

    const addingEmail = !hadEmail && !!draft.email;
    const addingPhone = !hadPhone && !!(draft.phonePrefix && draft.phoneNumber);

    setSaving(true);
    try {
      if (addingEmail || addingPhone) {
        await updateClientContact(client.id, {
          ...(addingEmail ? { email: draft.email! } : {}),
          ...(addingPhone ? { phonePrefix: draft.phonePrefix!, phoneNumber: draft.phoneNumber! } : {}),
        });
      }

      const { email: _email, phonePrefix: _prefix, phoneNumber: _number, password: _password, ...rest } = draft;
      void _email; void _prefix; void _number; void _password;

      await updateClient(client.id, {
        ...client,
        ...rest,
        birthDate: formattedBirthDate ?? undefined,
      });
      messagePopup.getState().success('Cliente aggiornato con successo!');
      setIsEditing(false);
      setDraft({});
      setErrors({});
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Errore durante l'aggiornamento.";
      messagePopup.getState().error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleArchive = async () => {
    if (!client) return;
    try {
      if (client.isArchived) {
        await restoreClient(client.id);
        messagePopup.getState().success('Cliente ripristinato.');
      } else {
        await archiveClient(client.id);
        messagePopup.getState().success('Cliente archiviato.');
        router.push('/admin/clienti');
      }
    } catch {
      messagePopup.getState().error("Errore durante l'operazione.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-16 h-16 border-4 border-zinc-500/25 border-t-primary rounded-full animate-spin" />
        <p className="mt-4 text-zinc-500 dark:text-zinc-400">Caricamento...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <UserX className="size-16 text-zinc-300 dark:text-zinc-600 mb-4" strokeWidth={1.5} />
        <h2 className="text-xl font-semibold text-zinc-700 dark:text-zinc-200 mb-2">Cliente non trovato</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{error ?? 'Il cliente non esiste o è stato rimosso.'}</p>
        <button
          className="mt-6 px-4 py-2 text-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-md transition-colors"
          onClick={() => router.push('/admin/clienti')}
        >
          Torna alla lista clienti
        </button>
      </div>
    );
  }

  const initials = `${client.firstName?.[0] ?? ''}${client.lastName?.[0] ?? ''}`.toUpperCase();
  const genderLabel = client.gender === 'M' ? 'Uomo' : client.gender === 'F' ? 'Donna' : null;
  const formattedBirth = client.birthDate
    ? (() => {
        const d = new Date(client.birthDate);
        return isValid(d) ? format(d, 'd MMM yyyy', { locale: it }) : null;
      })()
    : null;

  return (
    <>
      <DeleteClientModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        selectedClient={client}
      />

      <ConfirmDialog
        isOpen={discardConfirm !== null}
        onClose={() => setDiscardConfirm(null)}
        onConfirm={() => {
          discardConfirm?.action();
          setDiscardConfirm(null);
        }}
        title="Scartare le modifiche?"
        description="Le modifiche non salvate andranno perse."
        confirmLabel="Scarta"
        tone="warning"
      />

      <div className="flex flex-col">
        <DetailHero
          onBack={handleBack}
          avatar={<HeroAvatar initials={initials} />}
          title={`${client.firstName} ${client.lastName}`}
          chips={
            <>
              {client.isArchived && <DetailChip tone="amber">Archiviato</DetailChip>}
              {client.isTourist && (
                <DetailChip tone="sky" icon={Plane}>
                  Turista
                </DetailChip>
              )}
            </>
          }
          meta={
            <>
              {genderLabel && <span>{genderLabel}</span>}
              {genderLabel && formattedBirth && <span aria-hidden>·</span>}
              {formattedBirth && <span>nato il {formattedBirth}</span>}
            </>
          }
          aside={
            !isEditing && (
              <div className="flex flex-col gap-1 max-w-[280px]">
                <ContactRow
                  icon={Mail}
                  value={client.email}
                  emptyLabel="Nessuna email"
                  onCopy={(v) => {
                    navigator.clipboard.writeText(v);
                    messagePopup.getState().success('Email copiata negli appunti');
                  }}
                />
                <ContactRow
                  icon={Phone}
                  value={client.phonePrefix && client.phoneNumber ? `${client.phonePrefix} ${client.phoneNumber}` : null}
                  emptyLabel="Nessun telefono"
                  onCopy={(v) => {
                    navigator.clipboard.writeText(v.replace(/\s+/g, ''));
                    messagePopup.getState().success('Numero copiato negli appunti');
                  }}
                />
              </div>
            )
          }
          actions={
            <DetailHeroActions
              isEditing={isEditing}
              isLocked={client.isArchived}
              saving={saving}
              isDirty={isDirty}
              onEdit={handleEnterEdit}
              onCancel={handleCancel}
              onSave={handleSave}
              menuItems={[
                {
                  label: client.isArchived ? 'Ripristina' : 'Archivia',
                  icon: client.isArchived ? ArchiveRestore : Archive,
                  onClick: handleToggleArchive,
                },
                { label: 'Elimina', icon: Trash2, onClick: () => setShowDelete(true) },
              ]}
            />
          }
        />

        <div className="px-6 lg:px-10 py-8 max-w-5xl w-full mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            {isEditing ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <DetailSection label="Modifica dati">
                  <ClientForm
                    value={draft}
                    onChange={setDraft}
                    errors={errors}
                    lockEmail={hadEmail}
                    lockPhone={hadPhone}
                  />
                </DetailSection>
              </motion.div>
            ) : (
              <motion.div
                key="view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col gap-12"
              >
                <DetailSection index={0} label="Valutazione · ultimi 12 mesi">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <StatTile
                      label="Spesa totale"
                      value={rating ? formatEur(rating.total_spent) : '—'}
                      accent={rating ? { tone: 'emerald', text: STAR_TO_PERCENTILE[rating.spend_stars] } : undefined}
                    >
                      <SegmentedBar filled={rating?.spend_stars ?? 0} tone="emerald" groupDelay={0} />
                    </StatTile>
                    <StatTile
                      label="Visite"
                      value={rating ? String(rating.visit_count) : '—'}
                      accent={rating ? { tone: 'sky', text: STAR_TO_PERCENTILE[rating.visit_stars] } : undefined}
                    >
                      <SegmentedBar filled={rating?.visit_stars ?? 0} tone="sky" groupDelay={0.08} />
                    </StatTile>
                  </div>
                  {!rating && (
                    <p className="mt-4 text-sm text-zinc-400 dark:text-zinc-500 italic">
                      Nessuna visita negli ultimi 12 mesi.
                    </p>
                  )}
                </DetailSection>

                <DetailSection index={1} label="Scheda tecnica" id="scheda">
                  <TreatmentHistory clientId={client.id} />
                </DetailSection>

                <DetailSection index={2} label="Coupon e gift card">
                  <ClientCouponsList clientId={clientId} allCoupons={allCoupons} />
                </DetailSection>

                <DetailSection index={3} label="Note">
                  {client.note ? (
                    <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                      {client.note}
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">
                      Nessuna nota
                    </p>
                  )}
                </DetailSection>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Coupons list
// ---------------------------------------------------------------------------

function ClientCouponsList({
  clientId,
  allCoupons,
}: {
  clientId: string;
  allCoupons: ReturnType<typeof useCouponsStore.getState>['coupons'];
}) {
  const reduceMotion = useReducedMotion();
  const coupons = useMemo(
    () =>
      allCoupons
        .filter((c) => c.recipient_client_id === clientId || c.purchaser_client_id === clientId)
        .sort((a, b) => {
          if (a.isUsable !== b.isUsable) return a.isUsable ? -1 : 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }),
    [allCoupons, clientId],
  );

  if (coupons.length === 0) {
    return (
      <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">
        Nessun coupon o gift card.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-500/10 border-y border-zinc-500/10">
      {coupons.map((c, i) => {
        const isCard = c.kind === 'gift_card';
        const Icon = isCard ? CreditCard : Gift;
        const status = c.displayStatus();
        const statusColor =
          status === 'attivo'
            ? 'text-emerald-600 dark:text-emerald-400'
            : status === 'esaurito'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-zinc-400';
        const isAsRecipient = c.recipient_client_id === clientId;
        return (
          <motion.li
            key={c.id}
            className="py-3 flex items-center gap-3"
            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: i * 0.03 }}
          >
            <Icon className={`size-4 shrink-0 ${isCard ? 'text-emerald-500' : 'text-primary'}`} />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {isCard ? 'Gift card' : 'Coupon'} · {c.displayDiscount()}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                  {isAsRecipient ? 'destinatario' : 'acquirente'}
                </span>
              </div>
              <span className="text-xs text-zinc-500">
                Valido fino al {new Date(c.valid_until).toLocaleDateString('it-IT')}
              </span>
            </div>
            <span className={`text-xs font-medium ${statusColor}`}>{status}</span>
          </motion.li>
        );
      })}
    </ul>
  );
}
