'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, parse, isValid } from 'date-fns';
import { ArrowLeft, Edit, Trash2, Mail, Phone, Copy, Contact2, FileHeart, ClipboardList, UserX, Archive, ArchiveRestore, Sparkles, Tag, Gift, CreditCard, Save, X } from 'lucide-react';
import { useClientsStore } from '@/lib/stores/clients';
import { useClientRatingsStore } from '@/lib/stores/client_ratings';
import { useCouponsStore } from '@/lib/stores/coupons';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { DeleteClientModal } from '@/lib/components/admin/clients/DeleteClientModal';
import { ClientRatingBadge } from '@/lib/components/admin/clients/ClientRatingBadge';
import { ClientForm, validateBirthDate, type ClientFormValue, type ClientFormErrors } from '@/lib/components/admin/clients/ClientForm';
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

  const handleEnterEdit = () => {
    if (!client) return;
    setDraft(clientToDraft(client));
    setErrors({});
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm('Scartare le modifiche?')) return;
    setIsEditing(false);
    setDraft({});
    setErrors({});
  };

  const handleBack = () => {
    if (isEditing && isDirty && !window.confirm('Scartare le modifiche?')) return;
    router.push('/admin/clienti');
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
        <div className="w-16 h-16 border-4 border-zinc-500/25 border-t-blue-500 rounded-full animate-spin" />
        <p className="mt-4 text-zinc-500 dark:text-zinc-400">Caricamento...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
        <UserX className="size-16 text-zinc-400 dark:text-zinc-500 mb-4" />
        <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-300 mb-2">Cliente non trovato</h2>
        <p className="text-zinc-600 dark:text-zinc-400">{error ?? 'Il cliente non esiste o è stato rimosso.'}</p>
        <button
          className="mt-6 px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100 rounded-md transition-colors"
          onClick={() => router.push('/admin/clienti')}
        >
          Torna alla lista clienti
        </button>
      </div>
    );
  }

  const isMale = client.gender === 'M';
  const genderBg = isMale ? 'bg-blue-100 dark:bg-blue-900' : 'bg-pink-100 dark:bg-pink-900';
  const genderText = isMale ? 'text-blue-600 dark:text-blue-300' : 'text-pink-600 dark:text-pink-300';
  const genderBadge = isMale ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300';

  return (
    <>
      <DeleteClientModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        selectedClient={client}
      />

      <div className="flex h-full gap-0">
        {/* Left column */}
        <div className="w-1/3 p-4 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
              aria-label="Torna indietro"
            >
              <ArrowLeft className="size-5 text-zinc-600 dark:text-zinc-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{client.firstName} {client.lastName}</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Dettagli cliente</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-500/25 overflow-hidden">
            <div className="p-8 flex flex-col items-center">
              <div className={`size-32 rounded-full ${genderBg} flex items-center justify-center mb-4`}>
                <span className={`text-3xl font-bold ${genderText}`}>
                  {client.firstName?.[0]}{client.lastName?.[0]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{client.firstName} {client.lastName}</h2>
                {client.isArchived && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">Archiviato</span>
                )}
              </div>
              {client.birthDate && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Data di nascita: {new Date(client.birthDate).toLocaleDateString('it-IT')}
                </p>
              )}
              <div className="flex flex-row justify-between items-center mt-6 w-full border-t border-zinc-500/25 pt-6">
                <span className={`text-sm ${genderBadge} px-3 py-1 rounded-full`}>
                  {isMale ? 'Uomo' : 'Donna'}
                </span>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-md transition-colors disabled:opacity-50"
                      >
                        <X className="size-4" />
                        Annulla
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50"
                      >
                        <Save className="size-4" />
                        {saving ? 'Salvando...' : 'Salva'}
                      </button>
                    </>
                  ) : (
                    <>
                      {!client.isArchived && (
                        <button
                          onClick={handleEnterEdit}
                          className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-md transition-colors"
                          aria-label="Modifica cliente"
                        >
                          <Edit className="size-5 text-zinc-600 dark:text-zinc-300" />
                        </button>
                      )}
                      <button
                        onClick={handleToggleArchive}
                        className="p-2 bg-zinc-100 hover:bg-amber-100 dark:bg-zinc-800 dark:hover:bg-amber-900/30 rounded-md transition-colors"
                        title={client.isArchived ? 'Ripristina cliente' : 'Archivia cliente'}
                      >
                        {client.isArchived ? <ArchiveRestore className="size-5 text-zinc-600 dark:text-zinc-300" /> : <Archive className="size-5 text-zinc-600 dark:text-zinc-300" />}
                      </button>
                      <button
                        onClick={() => setShowDelete(true)}
                        className="p-2 bg-zinc-100 hover:bg-red-100 dark:bg-zinc-800 dark:hover:bg-red-900/30 rounded-md transition-colors"
                        aria-label="Elimina cliente"
                      >
                        <Trash2 className="size-5 text-zinc-600 dark:text-zinc-300 hover:text-red-600" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="w-2/3 p-4 overflow-y-auto flex flex-col gap-8">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-500/25 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-zinc-500/25">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Contact2 className="size-5 text-zinc-600 dark:text-zinc-400" />
                {isEditing ? 'Modifica dati' : 'Informazioni di contatto'}
              </h3>
            </div>
            <div className="p-6">
              {isEditing ? (
                <ClientForm
                  value={draft}
                  onChange={setDraft}
                  errors={errors}
                  lockEmail={hadEmail}
                  lockPhone={hadPhone}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="size-4 text-zinc-500 dark:text-zinc-400" />
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Email</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {client.email ? (
                        <>
                          <p className="text-base text-zinc-900 dark:text-zinc-100">{client.email}</p>
                          <button
                            className="p-1 text-zinc-400 hover:text-blue-500"
                            onClick={() => { if (!client.email) return; navigator.clipboard.writeText(client.email); messagePopup.getState().success('Email copiata negli appunti'); }}
                            title="Copia negli appunti"
                          >
                            <Copy className="size-4" />
                          </button>
                        </>
                      ) : (
                        <p className="text-base text-zinc-400 dark:text-zinc-500 italic">Nessuna email</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="size-4 text-zinc-500 dark:text-zinc-400" />
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Telefono</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {client.phonePrefix && client.phoneNumber ? (
                        <>
                          <p className="text-base text-zinc-900 dark:text-zinc-100">{client.phonePrefix} {client.phoneNumber}</p>
                          <button
                            className="p-1 text-zinc-400 hover:text-blue-500"
                            onClick={() => { if (!client.phonePrefix || !client.phoneNumber) return; navigator.clipboard.writeText(client.phonePrefix + client.phoneNumber); messagePopup.getState().success('Numero copiato negli appunti'); }}
                            title="Copia negli appunti"
                          >
                            <Copy className="size-4" />
                          </button>
                        </>
                      ) : (
                        <p className="text-base text-zinc-400 dark:text-zinc-500 italic">Nessun telefono</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isEditing && (
            <>
              <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-500/25 overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-zinc-500/25">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Sparkles className="size-5 text-zinc-600 dark:text-zinc-400" />
                    Valutazione (ultimi 12 mesi)
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Spesa totale</p>
                    <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {rating ? formatEur(rating.total_spent) : '—'}
                    </p>
                    <div className="flex items-center gap-2">
                      <ClientRatingBadge stars={rating ? rating.spend_stars : null} kind="money" size="md" />
                      {rating && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">{STAR_TO_PERCENTILE[rating.spend_stars]}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Visite</p>
                    <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {rating ? rating.visit_count : '—'}
                    </p>
                    <div className="flex items-center gap-2">
                      <ClientRatingBadge stars={rating ? rating.visit_stars : null} kind="calendar" size="md" />
                      {rating && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">{STAR_TO_PERCENTILE[rating.visit_stars]}</span>
                      )}
                    </div>
                  </div>
                  {!rating && (
                    <p className="md:col-span-2 text-sm text-zinc-400 dark:text-zinc-500 italic">
                      Nessuna visita negli ultimi 12 mesi.
                    </p>
                  )}
                </div>
              </div>

              <ClientCouponsSection clientId={clientId} allCoupons={allCoupons} />

              <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-500/25 overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-zinc-500/25">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <FileHeart className="size-5 text-zinc-600 dark:text-zinc-400" />
                    Note
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="size-4 text-zinc-500 dark:text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Note sul cliente</span>
                  </div>
                  {client.note ? (
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-md p-4 border border-zinc-500/25">
                      <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">{client.note}</p>
                    </div>
                  ) : (
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-md p-4 border border-dashed border-zinc-300 dark:border-zinc-700 text-center">
                      <p className="text-zinc-400 dark:text-zinc-500">Nessuna nota</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function ClientCouponsSection({
  clientId,
  allCoupons,
}: {
  clientId: string;
  allCoupons: ReturnType<typeof useCouponsStore.getState>['coupons'];
}) {
  const coupons = allCoupons
    .filter((c) => c.recipient_client_id === clientId || c.purchaser_client_id === clientId)
    .sort((a, b) => {
      if (a.isUsable !== b.isUsable) return a.isUsable ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-500/25 overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-zinc-500/25">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Tag className="size-5 text-zinc-600 dark:text-zinc-400" />
          Coupon e gift card
        </h3>
        <span className="text-xs text-zinc-400">{coupons.length}</span>
      </div>
      <div className="p-6">
        {coupons.length === 0 ? (
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-md p-4 border border-dashed border-zinc-300 dark:border-zinc-700 text-center">
            <p className="text-zinc-400 dark:text-zinc-500">Nessun coupon o gift card.</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-500/10">
            {coupons.map((c) => {
              const isCard = c.kind === 'gift_card';
              const Icon = isCard ? CreditCard : Gift;
              const status = c.displayStatus();
              const statusColor = status === 'attivo'
                ? 'text-emerald-600 dark:text-emerald-400'
                : status === 'esaurito'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-zinc-400';
              const isAsRecipient = c.recipient_client_id === clientId;
              return (
                <li key={c.id} className="py-3 flex items-center gap-3">
                  <Icon className={`size-4 shrink-0 ${isCard ? 'text-emerald-500' : 'text-indigo-500'}`} />
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
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
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
