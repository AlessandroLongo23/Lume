import Image from 'next/image';
import { MapPin, Phone } from 'lucide-react';
import type { PublicSalon } from '@/lib/gateway/loadPublicSalon';
import { TextLink } from '@/lib/components/shared/ui/TextLink';
import { PublicHeading } from './PublicHeading';

export function SalonHeader({ salon }: { salon: PublicSalon }) {
  const locationParts = [salon.address, salon.city, salon.province].filter(Boolean);
  const location = locationParts.join(', ');

  return (
    <header className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
      <div className="surface-card size-16 sm:size-20 overflow-hidden flex items-center justify-center shrink-0">
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
          <span className="text-2xl font-medium text-[var(--lume-text-secondary)]">
            {salon.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <PublicHeading>{salon.name}</PublicHeading>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--lume-text-secondary)]">
          {location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              {location}
            </span>
          )}
          {salon.phone && (
            <TextLink
              href={`tel:${salon.phone}`}
              className="inline-flex items-center gap-1.5 min-h-11 sm:min-h-0 font-normal text-[var(--lume-text-secondary)] hover:text-[var(--lume-text)]"
            >
              <Phone className="size-3.5 shrink-0" aria-hidden />
              {salon.phone}
            </TextLink>
          )}
        </div>
      </div>
    </header>
  );
}
