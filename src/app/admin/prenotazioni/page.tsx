'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Globe, Check, X, Loader2, ArrowRight, User, Clock, Scissors } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { useFichesStore } from '@/lib/stores/fiches';
import { useFicheServicesStore } from '@/lib/stores/fiche_services';
import { useClientsStore } from '@/lib/stores/clients';
import { useOperatorsStore } from '@/lib/stores/operators';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { FicheStatus } from '@/lib/types/ficheStatus';
import { Fiche } from '@/lib/types/Fiche';

type Tab = 'pending' | 'upcoming' | 'history';

const TAB_LABELS: Record<Tab, string> = {
  pending: 'Da approvare',
  upcoming: 'Prossime',
  history: 'Storico',
};

export default function PrenotazioniPage() {
  const fiches = useFichesStore((s) => s.fiches);
  const fichesLoading = useFichesStore((s) => s.isLoading);
  const fetchFiches = useFichesStore((s) => s.fetchFiches);

  const ficheServices = useFicheServicesStore((s) => s.fiche_services);
  const fetchFicheServices = useFicheServicesStore((s) => s.fetchFicheServices);

  const clients = useClientsStore((s) => s.clients);
  const fetchClients = useClientsStore((s) => s.fetchClients);

  const operators = useOperatorsStore((s) => s.operators);
  const fetchOperators = useOperatorsStore((s) => s.fetchOperators);

  const [tab, setTab] = useState<Tab>('pending');

  useEffect(() => {
    if (fiches.length === 0 && !fichesLoading) fetchFiches();
    if (ficheServices.length === 0) fetchFicheServices();
    if (clients.length === 0) fetchClients();
    if (operators.length === 0) fetchOperators();
  }, [
    fiches.length, fichesLoading, ficheServices.length, clients.length, operators.length,
    fetchFiches, fetchFicheServices, fetchClients, fetchOperators,
  ]);

  // Only online-source fiches feature in this inbox. Manual fiches stay
  // visible in /admin/fiches and /admin/calendario as before.
  const onlineFiches = useMemo(
    () => fiches.filter((f) => f.booking_source === 'online'),
    [fiches],
  );

  const now = useMemo(() => new Date(), []);

  const bucketed = useMemo(() => {
    const pending: Fiche[] = [];
    const upcoming: Fiche[] = [];
    const history: Fiche[] = [];
    for (const f of onlineFiches) {
      const dt = new Date(f.datetime);
      if (f.status === FicheStatus.PENDING_APPROVAL) {
        pending.push(f);
      } else if (
        (f.status === FicheStatus.CREATED || f.status === FicheStatus.PENDING) &&
        dt >= now
      ) {
        upcoming.push(f);
      } else {
        history.push(f);
      }
    }
    pending.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    upcoming.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    history.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
    return { pending, upcoming, history };
  }, [onlineFiches, now]);

  const counts = {
    pending: bucketed.pending.length,
    upcoming: bucketed.upcoming.length,
    history: bucketed.history.length,
  };

  const list = bucketed[tab];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Globe}
        title="Prenotazioni online"
        subtitle="Approva, monitora e consulta lo storico delle richieste arrivate dal sito pubblico."
      />

      <div role="tablist" className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {(['pending', 'upcoming', 'history'] as const).map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'text-primary border-b-2 border-primary -mb-px'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border-b-2 border-transparent -mb-px'
              }`}
            >
              {TAB_LABELS[t]}
              {counts[t] > 0 && (
                <span
                  className={`ml-2 inline-flex items-center justify-center rounded-full px-1.5 min-w-5 h-5 text-[11px] font-semibold ${
                    active
                      ? 'bg-primary text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {counts[t]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {fichesLoading && fiches.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-5 animate-spin text-zinc-400" />
        </div>
      ) : list.length === 0 ? (
        <EmptyTabState tab={tab} />
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((fiche) => (
            <BookingRow key={fiche.id} fiche={fiche} tab={tab} />
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyTabState({ tab }: { tab: Tab }) {
  const copy = {
    pending: 'Nessuna richiesta in attesa. Le nuove prenotazioni online compariranno qui.',
    upcoming: 'Nessuna prenotazione online imminente.',
    history: 'Lo storico è vuoto.',
  } satisfies Record<Tab, string>;
  return (
    <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-12">
      {copy[tab]}
    </p>
  );
}

function BookingRow({ fiche, tab }: { fiche: Fiche; tab: Tab }) {
  const ficheServices = useFicheServicesStore((s) => s.fiche_services);
  const clients = useClientsStore((s) => s.clients);
  const operators = useOperatorsStore((s) => s.operators);

  const services = useMemo(
    () => ficheServices.filter((fs) => fs.fiche_id === fiche.id),
    [ficheServices, fiche.id],
  );
  const firstService = services[0];
  const client = clients.find((c) => c.id === fiche.client_id);
  const operator = firstService
    ? operators.find((o) => o.id === firstService.operator_id)
    : null;

  const start = new Date(fiche.datetime);

  const [submittingAction, setSubmittingAction] = useState<'approve' | 'decline' | null>(null);

  const act = async (action: 'approve' | 'decline') => {
    setSubmittingAction(action);
    try {
      const res = await fetch(`/api/admin/bookings/${fiche.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = (await res.json()) as
        | { success: true; status: 'created' | 'cancelled'; email_sent: boolean }
        | { success: false; error: string };
      if (!res.ok || !json.success) {
        messagePopup.getState().error(json.success === false ? json.error : 'Errore.');
        return;
      }
      // Reflect immediately — realtime will reconcile but the user expects
      // the row to disappear from "Da approvare" the moment they click.
      useFichesStore.setState((s) => ({
        fiches: s.fiches.map((f) =>
          f.id === fiche.id
            ? new Fiche({ ...f, status: json.status as FicheStatus })
            : f,
        ),
      }));
      messagePopup
        .getState()
        .success(
          action === 'approve'
            ? json.email_sent
              ? 'Prenotazione confermata. Email inviata al cliente.'
              : 'Prenotazione confermata.'
            : json.email_sent
            ? 'Prenotazione rifiutata. Email inviata al cliente.'
            : 'Prenotazione rifiutata.',
        );
    } catch (err) {
      console.error(err);
      messagePopup.getState().error('Errore di rete. Riprova.');
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <li className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
      <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-[1.2fr_1.5fr_1fr] gap-3 sm:gap-5">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium flex items-center gap-1">
            <User className="size-3" />
            Cliente
          </p>
          <p className="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {client ? client.getFullName() : 'Cliente sconosciuto'}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium flex items-center gap-1">
            <Scissors className="size-3" />
            Servizio
          </p>
          <p className="mt-0.5 text-sm text-zinc-800 dark:text-zinc-200 truncate">
            {firstService?.name ?? 'Servizio'}
          </p>
          <p className="text-xs text-zinc-500 truncate">
            {operator ? `con ${operator.getFullName()}` : 'Operatore non assegnato'}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium flex items-center gap-1">
            <Clock className="size-3" />
            Quando
          </p>
          <p className="mt-0.5 text-sm text-zinc-800 dark:text-zinc-200 truncate">
            {format(start, 'EEE d MMM', { locale: it })} · {format(start, 'HH:mm')}
          </p>
          {tab === 'history' && (
            <p className="text-xs text-zinc-500 truncate">
              <StatusLabel status={fiche.status} />
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {tab === 'pending' ? (
          <>
            <button
              type="button"
              onClick={() => act('decline')}
              disabled={submittingAction !== null}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingAction === 'decline' ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <X className="size-3.5" />
              )}
              Rifiuta
            </button>
            <button
              type="button"
              onClick={() => act('approve')}
              disabled={submittingAction !== null}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-active text-white px-3 py-1.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingAction === 'approve' ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              Approva
            </button>
          </>
        ) : (
          <Link
            href={`/admin/fiches?edit=${fiche.id}`}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Vedi fiche
            <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>
    </li>
  );
}

function StatusLabel({ status }: { status: FicheStatus }) {
  switch (status) {
    case FicheStatus.CREATED:
    case FicheStatus.PENDING:
      return <span className="text-zinc-600 dark:text-zinc-300">Confermata</span>;
    case FicheStatus.COMPLETED:
      return <span className="text-emerald-600 dark:text-emerald-400">Conclusa</span>;
    case FicheStatus.CANCELLED:
      return <span className="text-red-600 dark:text-red-400">Annullata</span>;
    case FicheStatus.PENDING_APPROVAL:
      return <span className="text-amber-600 dark:text-amber-400">In attesa</span>;
    default:
      return null;
  }
}
