'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Check, Pencil, Calendar, Clock, Scissors, User, ClipboardCheck, Loader2 } from 'lucide-react';
import type { PublicSalon } from '@/lib/gateway/loadPublicSalon';
import type {
  AvailableSlot,
  BookableService,
  BookingIdentity,
  PublicClosure,
} from '@/lib/booking/publicTypes';
import { ServicePicker } from './ServicePicker';
import { OperatorPicker, type OperatorChoice } from './OperatorPicker';
import { DatePicker } from './DatePicker';
import { TimeSlotPicker } from './TimeSlotPicker';
import { IdentityForm } from './IdentityForm';
import { BookingConfirmation } from './BookingConfirmation';

type Step = 'service' | 'operator' | 'date' | 'time' | 'identity' | 'review';

type ConfirmedState = {
  status: 'created' | 'pending_approval';
  fiche_id: string;
  email_sent: boolean;
  service: BookableService;
  start_at: string;
};

const DEFAULT_MAX_LEAD_DAYS = 60;

export function BookingFlow({
  slug,
  salon,
  services,
  closures,
}: {
  slug: string;
  salon: PublicSalon;
  services: BookableService[];
  closures: PublicClosure[];
}) {
  const allowOperatorChoice = salon.booking_config.allow_operator_choice ?? true;
  const maxLeadDays = salon.booking_config.max_lead_days ?? DEFAULT_MAX_LEAD_DAYS;
  const publicMessage = salon.booking_config.public_message ?? null;
  const accessMode = salon.booking_config.access_mode ?? 'public';
  const guestEmailRequired = salon.booking_config.guest_email_required ?? false;
  const requireApproval = salon.booking_config.require_approval ?? false;

  const [service, setService] = useState<BookableService | null>(null);
  // undefined = not yet chosen; null = "any operator"; BookableOperator = specific.
  const [operator, setOperator] = useState<OperatorChoice | undefined>(undefined);
  const [date, setDate] = useState<Date | null>(null);
  const [slot, setSlot] = useState<AvailableSlot | null>(null);
  const [identity, setIdentity] = useState<BookingIdentity | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedState | null>(null);

  const operatorStepDone = !allowOperatorChoice || operator !== undefined;
  const operatorStepActive = allowOperatorChoice && service !== null && operator === undefined;
  const dateStepActive = service !== null && operatorStepDone && date === null;
  const timeStepActive = service !== null && date !== null && slot === null;
  const identityStepActive = slot !== null && identity === null;
  const reviewStepActive = identity !== null;

  const currentStep: Step = service === null
    ? 'service'
    : operatorStepActive
    ? 'operator'
    : dateStepActive
    ? 'date'
    : timeStepActive
    ? 'time'
    : identityStepActive
    ? 'identity'
    : 'review';

  // Editing collapses subsequent state so the visitor always picks a fresh
  // operator/date/slot — the previous choices may not be valid anymore.
  const editService = () => {
    setService(null);
    setOperator(undefined);
    setDate(null);
    setSlot(null);
    setIdentity(null);
  };
  const editOperator = () => {
    setOperator(undefined);
    setDate(null);
    setSlot(null);
    setIdentity(null);
  };
  const editDate = () => {
    setDate(null);
    setSlot(null);
    setIdentity(null);
  };
  const editSlot = () => {
    setSlot(null);
    setIdentity(null);
  };
  const editIdentity = () => {
    setIdentity(null);
  };

  const submit = async () => {
    if (!service || !slot || !identity) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          service_id: service.id,
          operator_id: slot.operator_id,
          start_at: slot.start_at,
          first_name: identity.first_name,
          last_name: identity.last_name,
          phone_prefix: identity.phone_prefix,
          phone: identity.phone,
          email: identity.email,
          note: identity.note,
        }),
      });
      const json = (await res.json()) as
        | { success: true; status: 'created' | 'pending_approval'; fiche_id: string; email_sent: boolean }
        | { success: false; error: string };
      if (!res.ok || !json.success) {
        setSubmitError(json.success === false ? json.error : 'Errore durante la creazione della prenotazione.');
        return;
      }
      setConfirmed({
        status: json.status,
        fiche_id: json.fiche_id,
        email_sent: json.email_sent,
        service,
        start_at: slot.start_at,
      });
    } catch (err) {
      console.error(err);
      setSubmitError('Errore di rete. Riprova fra qualche istante.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <section className="mt-10">
        <BookingConfirmation
          status={confirmed.status}
          service={confirmed.service}
          startAt={confirmed.start_at}
          emailSent={confirmed.email_sent}
        />
      </section>
    );
  }

  const dateIndex = allowOperatorChoice ? 3 : 2;
  const timeIndex = allowOperatorChoice ? 4 : 3;
  const identityIndex = allowOperatorChoice ? 5 : 4;
  const reviewIndex = allowOperatorChoice ? 6 : 5;

  return (
    <section className="mt-10 flex flex-col gap-3">
      {publicMessage && currentStep === 'service' && (
        <div className="rounded-xl border border-[var(--lume-border)] bg-[var(--lume-accent-muted)] p-4 text-sm text-[var(--lume-text)] whitespace-pre-wrap">
          {publicMessage}
        </div>
      )}

      <StepCard
        index={1}
        icon={Scissors}
        title="Servizio"
        active={currentStep === 'service'}
        done={service !== null}
        summary={service ? service.name : undefined}
        onEdit={service ? editService : undefined}
      >
        <ServicePicker services={services} onSelect={(svc) => setService(svc)} />
      </StepCard>

      {allowOperatorChoice && service && (
        <StepCard
          index={2}
          icon={User}
          title="Operatore"
          active={currentStep === 'operator'}
          done={operator !== undefined}
          summary={
            operator === undefined
              ? undefined
              : operator === null
              ? 'Qualunque operatore'
              : `${operator.first_name} ${operator.last_name}`
          }
          onEdit={operator !== undefined ? editOperator : undefined}
        >
          {currentStep === 'operator' && (
            <OperatorPicker
              salonId={salon.id}
              serviceId={service.id}
              onSelect={(choice) => setOperator(choice)}
            />
          )}
        </StepCard>
      )}

      {service && operatorStepDone && (
        <StepCard
          index={dateIndex}
          icon={Calendar}
          title="Data"
          active={currentStep === 'date'}
          done={date !== null}
          summary={date ? format(date, "EEEE d MMMM yyyy", { locale: it }) : undefined}
          onEdit={date ? editDate : undefined}
        >
          {currentStep === 'date' && (
            <DatePicker
              operatingHours={salon.operating_hours}
              closures={closures}
              maxLeadDays={maxLeadDays}
              selectedDate={date}
              onSelect={(d) => setDate(d)}
            />
          )}
        </StepCard>
      )}

      {service && date && (
        <StepCard
          index={timeIndex}
          icon={Clock}
          title="Orario"
          active={currentStep === 'time'}
          done={slot !== null}
          summary={slot ? format(new Date(slot.start_at), 'HH:mm') : undefined}
          onEdit={slot ? editSlot : undefined}
        >
          {currentStep === 'time' && (
            <TimeSlotPicker
              salonId={salon.id}
              serviceId={service.id}
              operatorId={operator ? operator.id : null}
              day={date}
              onSelect={(s) => setSlot(s)}
            />
          )}
        </StepCard>
      )}

      {slot && (
        <StepCard
          index={identityIndex}
          icon={User}
          title="I tuoi dati"
          active={currentStep === 'identity'}
          done={identity !== null}
          summary={identity ? `${identity.first_name} ${identity.last_name}` : undefined}
          onEdit={identity ? editIdentity : undefined}
        >
          {currentStep === 'identity' && (
            <IdentityForm
              salonId={salon.id}
              accessMode={accessMode}
              guestEmailRequired={guestEmailRequired}
              requireApproval={requireApproval}
              onSubmit={(id) => setIdentity(id)}
            />
          )}
        </StepCard>
      )}

      {reviewStepActive && service && slot && identity && (
        <StepCard
          index={reviewIndex}
          icon={ClipboardCheck}
          title="Riepilogo"
          active
          done={false}
        >
          <ReviewBody
            service={service}
            operator={operator ?? null}
            startAt={slot.start_at}
            identity={identity}
            requireApproval={requireApproval}
            submitting={submitting}
            submitError={submitError}
            onSubmit={submit}
          />
        </StepCard>
      )}
    </section>
  );
}

function ReviewBody({
  service,
  operator,
  startAt,
  identity,
  requireApproval,
  submitting,
  submitError,
  onSubmit,
}: {
  service: BookableService;
  operator: OperatorChoice;
  startAt: string;
  identity: BookingIdentity;
  requireApproval: boolean;
  submitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
}) {
  const start = new Date(startAt);
  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <ReviewRow label="Servizio" value={service.name} />
        <ReviewRow
          label="Operatore"
          value={operator === null ? 'Qualunque operatore' : `${operator.first_name} ${operator.last_name}`}
        />
        <ReviewRow
          label="Data"
          value={format(start, "EEEE d MMMM yyyy", { locale: it })}
        />
        <ReviewRow label="Orario" value={format(start, 'HH:mm')} />
        <ReviewRow label="Nome" value={`${identity.first_name} ${identity.last_name}`} />
        <ReviewRow
          label="Telefono"
          value={`${identity.phone_prefix} ${identity.phone}`}
        />
        {identity.email && <ReviewRow label="Email" value={identity.email} />}
        {identity.note && <ReviewRow label="Note" value={identity.note} fullWidth />}
      </dl>

      {requireApproval && (
        <p className="text-xs text-[var(--lume-text-muted)] bg-[var(--lume-warning-bg)] border border-[var(--lume-warning-border)] text-[var(--lume-warning-fg)] rounded-lg px-3 py-2">
          Questa prenotazione richiede l&apos;approvazione del salone. Ti scriveremo non appena viene confermata.
        </p>
      )}

      {submitError && (
        <p className="text-sm text-[var(--lume-danger-fg)] bg-[var(--lume-danger-bg)] border border-[var(--lume-danger-border)] rounded-lg px-3 py-2">
          {submitError}
        </p>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="self-start inline-flex items-center gap-2 rounded-lg bg-[var(--lume-button-accent-bg)] hover:bg-[var(--lume-button-accent-bg-hover)] active:bg-[var(--lume-button-accent-bg-active)] text-[var(--lume-button-accent-fg)] px-5 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lume-ring-focus)]"
      >
        {submitting && <Loader2 className="size-4 animate-spin" />}
        {requireApproval ? 'Invia richiesta' : 'Conferma prenotazione'}
      </button>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? 'sm:col-span-2' : undefined}>
      <dt className="text-[11px] uppercase tracking-wider text-[var(--lume-text-muted)] font-medium">{label}</dt>
      <dd className="mt-0.5 text-[var(--lume-text)]">{value}</dd>
    </div>
  );
}

function StepCard({
  index,
  icon: Icon,
  title,
  active,
  done,
  summary,
  onEdit,
  children,
}: {
  index: number;
  icon: React.ElementType;
  title: string;
  active: boolean;
  done: boolean;
  summary?: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border transition-colors ${
        active
          ? 'border-[var(--lume-accent)] bg-[var(--lume-surface-raised)] shadow-sm'
          : 'border-[var(--lume-border)] bg-[var(--lume-surface)]'
      }`}
    >
      <header className="flex items-center gap-3 px-5 py-4">
        <span
          className={`size-7 shrink-0 rounded-full inline-flex items-center justify-center text-xs font-semibold ${
            done
              ? 'bg-[var(--lume-accent)] text-[var(--lume-text-on-accent)]'
              : active
              ? 'bg-[var(--lume-accent-muted)] text-[var(--lume-accent)]'
              : 'bg-[var(--lume-surface-raised)] text-[var(--lume-text-muted)] border border-[var(--lume-border)]'
          }`}
        >
          {done ? <Check className="size-3.5" /> : index}
        </span>
        <Icon className="size-4 text-[var(--lume-text-secondary)]" />
        <h2 className="text-sm font-medium text-[var(--lume-text)] flex-1">
          {title}
          {summary && (
            <span className="ml-2 text-[var(--lume-text-secondary)] font-normal">· {summary}</span>
          )}
        </h2>
        {onEdit && !active && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 text-xs text-[var(--lume-accent)] hover:underline"
          >
            <Pencil className="size-3" />
            Modifica
          </button>
        )}
      </header>
      {active && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}
