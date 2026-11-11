'use client';

import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { CalendarDays, MapPin, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';
import { Button } from '@/lib/components/shared/ui/Button';
import { Callout } from '@/lib/components/shared/ui/Callout';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { FicheStatus } from '@/lib/types/ficheStatus';
import { StatusDot, type StatusTone } from '@/lib/components/shared/ui/StatusDot';

/** Shape returned by GET /api/client-dashboard. */
type Appointment = {
  id:        string;
  /** ISO timestamp. */
  datetime:  string;
  status:    FicheStatus;
  salonId:   string | null;
  salonName: string;
};

// Same wording as the public booking page. Status reads as a dot beside a word.
const STATUS_LABELS: Record<FicheStatus, { label: string; tone: StatusTone }> = {
  [FicheStatus.CREATED]:          { label: 'Confermata',             tone: 'success' },
  [FicheStatus.PENDING]:          { label: 'In attesa',              tone: 'warning' },
  [FicheStatus.PENDING_APPROVAL]: { label: 'In attesa di conferma',  tone: 'warning' },
  [FicheStatus.COMPLETED]:        { label: 'Completata',             tone: 'neutral' },
  [FicheStatus.CANCELLED]:        { label: 'Annullata',              tone: 'danger' },
};

function StatusBadge({ status }: { status: FicheStatus }) {
  const s = STATUS_LABELS[status];
  return (
    <StatusDot tone={s.tone} className="text-sm">{s.label}</StatusDot>
  );
}

export default function ClientDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/client-dashboard')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAppointments(data);
        } else {
          setError('Impossibile caricare gli appuntamenti.');
        }
      })
      .catch(() => setError('Errore di rete. Riprova.'))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen bg-[var(--lume-bg)]">
      {/* Minimal navbar */}
      <header className="bg-[var(--lume-surface)] border-b border-line px-4 py-3 flex items-center justify-between">
        <LumeLogo size="sm" />
        <Button variant="ghost" size="sm" leadingIcon={LogOut} onClick={handleLogout}>
          Esci
        </Button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6">
          <PageHeader title="I tuoi appuntamenti" subtitle="Prossime prenotazioni in tutti i saloni" />
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="surface-card p-4 animate-pulse motion-reduce:animate-none">
                <div className="h-3 bg-hover rounded w-1/3 mb-2" />
                <div className="h-4 bg-hover rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <Callout tone="danger">{error}</Callout>
        )}

        {!isLoading && !error && appointments.length === 0 && (
          <EmptyState
            icon={CalendarDays}
            title="Nessun appuntamento in programma"
            description="I tuoi prossimi appuntamenti appariranno qui"
          />
        )}

        {!isLoading && appointments.length > 0 && (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="surface-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--lume-text)] first-letter:uppercase">
                      {format(parseISO(appt.datetime), "EEEE d MMMM", { locale: it })}
                      {' · '}
                      <span className="tabular-nums">{format(parseISO(appt.datetime), "HH:mm")}</span>
                    </p>
                    <div className="flex items-center gap-1.5 text-sm text-[var(--lume-text-secondary)] mt-1">
                      <MapPin className="size-3.5 text-[var(--lume-text-muted)] shrink-0" aria-hidden />
                      <span className="truncate">{appt.salonName}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusBadge status={appt.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
