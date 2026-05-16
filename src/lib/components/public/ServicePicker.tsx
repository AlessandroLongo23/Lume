'use client';

import Image from 'next/image';
import { Clock, ChevronRight } from 'lucide-react';
import type { BookableService } from '@/lib/booking/publicTypes';

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(price);
}

export function ServicePicker({
  services,
  onSelect,
}: {
  services: BookableService[];
  onSelect: (service: BookableService) => void;
}) {
  if (services.length === 0) {
    return (
      <p className="text-sm text-[var(--lume-text-secondary)]">
        Al momento non ci sono servizi prenotabili online.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {services.map((service) => (
        <li key={service.id}>
          <button
            type="button"
            onClick={() => onSelect(service)}
            className="group w-full flex items-center gap-4 p-4 rounded-xl border border-[var(--lume-border)] bg-[var(--lume-surface-raised)] hover:border-[var(--lume-accent)] hover:bg-[var(--lume-accent-muted)] transition-colors text-left"
          >
            {service.image_url ? (
              <div className="size-14 shrink-0 rounded-lg overflow-hidden bg-[var(--lume-surface)]">
                <Image
                  src={service.image_url}
                  alt={service.name}
                  width={56}
                  height={56}
                  className="size-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="size-14 shrink-0 rounded-lg bg-[var(--lume-accent-muted)] flex items-center justify-center text-[var(--lume-accent)] font-semibold">
                {service.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[var(--lume-text)] truncate">{service.name}</p>
              {service.description && (
                <p className="mt-0.5 text-xs text-[var(--lume-text-secondary)] line-clamp-2">
                  {service.description}
                </p>
              )}
              <p className="mt-1.5 inline-flex items-center gap-3 text-xs text-[var(--lume-text-secondary)]">
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" />
                  {formatDuration(service.duration)}
                </span>
                <span className="font-medium text-[var(--lume-text)]">{formatPrice(service.price)}</span>
              </p>
            </div>
            <ChevronRight className="size-4 text-[var(--lume-text-muted)] group-hover:text-[var(--lume-accent)] shrink-0" />
          </button>
        </li>
      ))}
    </ul>
  );
}
