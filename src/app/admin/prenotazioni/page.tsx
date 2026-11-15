'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Check, X, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { TabBar, TabButton } from '@/lib/components/shared/ui/Tabs';
import { Button } from '@/lib/components/shared/ui/Button';
import { StatusDot } from '@/lib/components/shared/ui/StatusDot';
import { useFichesStore } from '@/lib/stores/fiches';
import { useFicheServicesStore } from '@/lib/stores/fiche_services';
import { useClientsStore } from '@/lib/stores/clients';
import { useOperatorsStore } from '@/lib/stores/operators';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { FicheStatus } from '@/lib/types/ficheStatus';
import type { Fiche } from '@/lib/types/Fiche';
import { withPatch } from '@/lib/types/withPatch';

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
    <div className="flex flex-col gap-6" data-tour="prenotazioni-page">
      <PageHeader
        title="Prenotazioni online"
        subtitle="Approva, monitora e consulta lo storico delle richieste arrivate dal sito pubblico."
      />

      <TabBar label="Prenotazioni online" data-tour="prenotazioni-tabs">
        {(['pending', 'upcoming', 'history'] as const).map((t) => {
          const active = t === tab;
          return (
            <TabButton key={t} active={active} count={counts[t] > 0 ? counts[t] : undefined} onClick={() => setTab(t)}>
              {TAB_LABELS[t]}
            </TabButton>
          );
        })}
      </TabBar>

      {fichesLoading && fiches.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-5 animate-spin motion-reduce:animate-none text-[var(--lume-text-muted)]" />
        </div>
      ) : list.length === 0 ? (
        <EmptyTabState tab={tab} />
      ) : (
        <ul className="surface-card divide-y divide-line">
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
    <p className="text-sm text-[var(--lume-text-secondary)] text-center py-12 px-6 rounded-xl bg-hover">
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
            ? withPatch(f, {
                status: json.status === 'created' ? FicheStatus.CREATED : FicheStatus.CANCELLED,
              })
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
    <li className="px-4 py-3 sm:px-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
      <div className="min-w-0 flex-1 grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,1fr)] gap-x-5 gap-y-1 items-baseline">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--lume-text)] truncate">
            {client ? client.getFullName() : 'Cliente sconosciuto'}
          </p>
          {tab === 'history' && (
            <p className="mt-0.5 text-xs truncate">
              <StatusLabel status={fiche.status} />
            </p>
          )}
        </div>
        <div className="min-w-0 col-span-2 sm:col-span-1 order-last sm:order-none">
          <p className="text-sm text-[var(--lume-text)] truncate">
            {firstService?.name ?? 'Servizio'}
          </p>
          <p className="text-xs text-[var(--lume-text-secondary)] truncate">
            {operator ? `con ${operator.getFullName()}` : 'Operatore non assegnato'}
          </p>
        </div>
        <div className="min-w-0 text-right sm:text-left">
          <p className="text-sm text-[var(--lume-text-secondary)] truncate first-letter:uppercase">
            {format(start, 'EEE d MMM', { locale: it })}
            <span className="ml-2 tabular-nums text-compact text-[var(--lume-text)]">{format(start, 'HH:mm')}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {tab === 'pending' ? (
          <>
            <Button
              variant="ghost"
              size="md"
              onClick={() => act('decline')}
              disabled={submittingAction !== null}
              className="max-sm:flex-1"
            >
              {submittingAction === 'decline' ? (
                <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <X className="size-4" />
              )}
              Rifiuta
            </Button>
            {/* Secondary, not indigo: a list of requests would otherwise show
                one primary button per row. The check carries the success hue. */}
            <Button
              variant="secondary"
              size="md"
              onClick={() => act('approve')}
              disabled={submittingAction !== null}
              className="max-sm:flex-1"
            >
              {submittingAction === 'approve' ? (
                <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <Check className="size-4 text-success-strong" />
              )}
              Approva
            </Button>
          </>
        ) : (
          <Button asChild variant="ghost" className="-mr-3">
            <Link href={`/admin/fiches?edit=${fiche.id}`}>
              Vedi fiche
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        )}
      </div>
    </li>
  );
}

function StatusLabel({ status }: { status: FicheStatus }) {
  switch (status) {
    case FicheStatus.CREATED:
    case FicheStatus.PENDING:
      return <StatusDot tone="info">Confermata</StatusDot>;
    case FicheStatus.COMPLETED:
      return <StatusDot tone="success">Conclusa</StatusDot>;
    case FicheStatus.CANCELLED:
      return <StatusDot tone="danger">Annullata</StatusDot>;
    case FicheStatus.PENDING_APPROVAL:
      return <StatusDot tone="warning">In attesa</StatusDot>;
    default:
      return null;
  }
}
