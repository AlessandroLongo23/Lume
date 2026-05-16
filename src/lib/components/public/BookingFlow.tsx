'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Check, Pencil, Calendar, Clock, Scissors, User } from 'lucide-react';
import type { PublicSalon } from '@/lib/gateway/loadPublicSalon';
import type {
  AvailableSlot,
  BookableService,
  PublicClosure,
} from '@/lib/booking/publicTypes';
import { ServicePicker } from './ServicePicker';
import { OperatorPicker, type OperatorChoice } from './OperatorPicker';
import { DatePicker } from './DatePicker';
import { TimeSlotPicker } from './TimeSlotPicker';

type Step = 'service' | 'operator' | 'date' | 'time' | 'review';

const DEFAULT_MAX_LEAD_DAYS = 60;

export function BookingFlow({
  salon,
  services,
  closures,
}: {
  salon: PublicSalon;
  services: BookableService[];
  closures: PublicClosure[];
}) {
  const allowOperatorChoice = salon.booking_config.allow_operator_choice ?? true;
  const maxLeadDays = salon.booking_config.max_lead_days ?? DEFAULT_MAX_LEAD_DAYS;
  const publicMessage = salon.booking_config.public_message ?? null;

  const [service, setService] = useState<BookableService | null>(null);
  // undefined = not yet chosen; null = "any operator"; BookableOperator = specific.
  const [operator, setOperator] = useState<OperatorChoice | undefined>(undefined);
  const [date, setDate] = useState<Date | null>(null);
  const [slot, setSlot] = useState<AvailableSlot | null>(null);

  const operatorStepActive = allowOperatorChoice && service !== null && operator === undefined;
  const dateStepActive =
    service !== null && (!allowOperatorChoice || operator !== undefined) && date === null;
  const timeStepActive = service !== null && date !== null && slot === null;
  const reviewStepActive = slot !== null;

  const currentStep: Step = service === null
    ? 'service'
    : operatorStepActive
    ? 'operator'
    : dateStepActive
    ? 'date'
    : timeStepActive
    ? 'time'
    : 'review';

  // Editing collapses subsequent state so the visitor always picks a fresh
  // operator/date/slot — the previous choices may not be valid anymore.
  const editService = () => {
    setService(null);
    setOperator(undefined);
    setDate(null);
    setSlot(null);
  };
  const editOperator = () => {
    setOperator(undefined);
    setDate(null);
    setSlot(null);
  };
  const editDate = () => {
    setDate(null);
    setSlot(null);
  };

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
        <ServicePicker
          services={services}
          onSelect={(svc) => setService(svc)}
        />
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

      {service && (!allowOperatorChoice || operator !== undefined) && (
        <StepCard
          index={allowOperatorChoice ? 3 : 2}
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
          index={allowOperatorChoice ? 4 : 3}
          icon={Clock}
          title="Orario"
          active={currentStep === 'time'}
          done={slot !== null}
          summary={slot ? format(new Date(slot.start_at), 'HH:mm') : undefined}
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

      {reviewStepActive && slot && (
        <div className="mt-2 rounded-xl border border-[var(--lume-border)] bg-[var(--lume-surface-raised)] p-6">
          <p className="text-sm text-[var(--lume-text-secondary)]">
            Hai scelto: {service?.name} ·{' '}
            {date ? format(date, "EEEE d MMMM", { locale: it }) : ''} · alle{' '}
            {format(new Date(slot.start_at), 'HH:mm')}.
          </p>
          <p className="mt-3 text-xs text-[var(--lume-text-muted)]">
            Il modulo di conferma sarà disponibile a breve.
          </p>
        </div>
      )}
    </section>
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
