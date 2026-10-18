'use client';

import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { CalendarDays, MapPin, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';
import { Button } from '@/lib/components/shared/ui/Button';
import { FicheStatus } from '@/lib/types/ficheStatus';

/** Shape returned by GET /api/client-dashboard. */
type Appointment = {
  id:        string;
  /** ISO timestamp. */
  datetime:  string;
  status:    FicheStatus;
  salonId:   string | null;
  salonName: string;
};

const SUCCESS = 'bg-[var(--lume-success-bg)] text-[var(--lume-success-fg)] border border-[var(--lume-success-border)]';
const WARNING = 'bg-[var(--lume-warning-bg)] text-[var(--lume-warning-fg)] border border-[var(--lume-warning-border)]';

// Same wording as the public booking page.
const STATUS_LABELS: Record<FicheStatus, { label: string; className: string }> = {
  [FicheStatus.CREATED]:          { label: 'Confermata',             className: SUCCESS },
  [FicheStatus.PENDING]:          { label: 'In attesa',              className: WARNING },
  [FicheStatus.PENDING_APPROVAL]: { label: 'In attesa di conferma',  className: WARNING },
  [FicheStatus.COMPLETED]:        { label: 'Completata',             className: 'bg-[var(--lume-surface)] text-[var(--lume-text-secondary)] border border-[var(--lume-border)]' },
  [FicheStatus.CANCELLED]:        { label: 'Annullata',              className: 'bg-[var(--lume-danger-bg)] text-[var(--lume-danger-fg)] border border-[var(--lume-danger-border)]' },
};

function StatusBadge({ status }: { status: FicheStatus }) {
  const s = STATUS_LABELS[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
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
    <div className="min-h-screen bg-zinc-50">
      {/* Minimal navbar */}
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
        <LumeLogo size="sm" />
        <Button variant="ghost" size="sm" leadingIcon={LogOut} onClick={handleLogout}>
          Esci
        </Button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-zinc-900">I tuoi appuntamenti</h1>
          <p className="text-sm text-zinc-500 mt-1">Prossime prenotazioni in tutti i saloni</p>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-zinc-200 rounded-xl p-4 animate-pulse">
                <div className="h-3 bg-zinc-100 rounded w-1/3 mb-2" />
                <div className="h-4 bg-zinc-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && appointments.length === 0 && (
          <div className="text-center py-16">
            <CalendarDays className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-600">Nessun appuntamento in programma</p>
            <p className="text-xs text-zinc-400 mt-1">I tuoi prossimi appuntamenti appariranno qui</p>
          </div>
        )}

        {!isLoading && appointments.length > 0 && (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-primary-hover uppercase tracking-wide mb-1">
                      {format(parseISO(appt.datetime), "EEEE d MMMM", { locale: it })}
                      {' · '}
                      {format(parseISO(appt.datetime), "HH:mm")}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm text-zinc-600 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="font-medium text-zinc-800 truncate">{appt.salonName}</span>
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
