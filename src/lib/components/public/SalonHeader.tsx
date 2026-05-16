import Image from 'next/image';
import { MapPin, Phone } from 'lucide-react';
import type { PublicSalon } from '@/lib/gateway/loadPublicSalon';

export function SalonHeader({ salon }: { salon: PublicSalon }) {
  const locationParts = [salon.address, salon.city, salon.province].filter(Boolean);
  const location = locationParts.join(', ');

  return (
    <header className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
      <div className="size-16 sm:size-20 rounded-xl overflow-hidden bg-[var(--lume-surface)] border border-[var(--lume-border)] flex items-center justify-center shrink-0">
        {salon.logo_url ? (
          <Image
            src={salon.logo_url}
            alt={salon.name}
            width={80}
            height={80}
            className="size-full object-contain"
            unoptimized
          />
        ) : (
          <span className="text-2xl font-semibold text-[var(--lume-text-muted)]">
            {salon.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--lume-text)] truncate">
          {salon.name}
        </h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--lume-text-secondary)]">
          {location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {location}
            </span>
          )}
          {salon.phone && (
            <a href={`tel:${salon.phone}`} className="inline-flex items-center gap-1.5 hover:text-[var(--lume-text)]">
              <Phone className="size-3.5" />
              {salon.phone}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
