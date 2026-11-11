import type { ReactNode } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The recap of one appointment on a soft panel: service, when, and (when
 * known) operator and place. Used by the booking confirmation and the
 * manage-your-booking page.
 */
export function BookingSummary({
  serviceName,
  start,
  operatorName,
  location,
  muted = false,
  className,
}: {
  serviceName: string;
  start: Date;
  operatorName?: string;
  location?: string;
  /** A cancelled booking: the recap stays, faded. */
  muted?: boolean;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        'grid grid-cols-1 gap-y-3 rounded-xl bg-hover p-5 text-sm text-left',
        muted && 'opacity-75',
        className,
      )}
    >
      <Row label="Servizio" value={serviceName} />
      <Row label="Quando" value={`${format(start, 'EEEE d MMMM yyyy', { locale: it })} · ${format(start, 'HH:mm')}`} />
      {operatorName && <Row label="Operatore" value={operatorName} />}
      {location && (
        <Row
          label="Dove"
          value={
            <span className="inline-flex items-start gap-1.5">
              <MapPin className="size-3.5 mt-0.5 shrink-0" aria-hidden />
              {location}
            </span>
          }
        />
      )}
    </dl>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[var(--lume-text-muted)]">{label}</dt>
      <dd className="text-right text-[var(--lume-text)] font-medium first-letter:uppercase">{value}</dd>
    </div>
  );
}
