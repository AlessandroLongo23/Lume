'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plane, Mail, Phone, Cake, Trash, ArchiveRestore, Wallet, CalendarDays, Plus, Sparkles,
} from 'lucide-react';
import type { Client } from '@/lib/types/Client';
import { useClientRatingsStore } from '@/lib/stores/client_ratings';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { IncompleteContactBadge } from './IncompleteContactBadge';
import styles from './ClientCard.module.css';

interface ClientCardProps {
  client: Client;
  onDelete: (client: Client) => void;
  onRestore?: (client: Client) => void;
  showArchived?: boolean;
}

const NEW_CLIENT_DAYS = 14;
const BIRTHDAY_WINDOW_DAYS = 30;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysUntilNextBirthday(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (next.getTime() < todayMidnight.getTime()) {
    next = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
  }
  return Math.round((next.getTime() - todayMidnight.getTime()) / MS_PER_DAY);
}

function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  return (Date.now() - date.getTime()) / MS_PER_DAY;
}

function birthdayTooltip(days: number): string {
  if (days === 0) return 'Compleanno oggi';
  if (days === 1) return 'Compleanno domani';
  return `Compleanno tra ${days} giorni`;
}

export function ClientCard({ client, onDelete, onRestore, showArchived = false }: ClientCardProps) {
  const router = useRouter();
  const rating = useClientRatingsStore((s) => s.ratings[client.id]);
  const created = (client as unknown as { created_at?: string }).created_at;
  const initials = `${client.firstName?.[0] ?? ''}${client.lastName?.[0] ?? ''}`.toUpperCase();
  const fullName = `${client.firstName} ${client.lastName}`.trim();

  const sinceCreated = daysSince(created);
  const isNew = sinceCreated !== null && sinceCreated <= NEW_CLIENT_DAYS;
  const daysToBday = daysUntilNextBirthday(client.birthDate);
  const isBirthdaySoon = daysToBday !== null && daysToBday <= BIRTHDAY_WINDOW_DAYS;

  const goToDetail = () => router.push(`/admin/clienti/${client.id}`);
  const goToEditContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/admin/clienti/${client.id}?edit=${client.id}`);
  };

  return (
    <div
      id={`client-card-${client.id}`}
      role="button"
      tabIndex={0}
      aria-label={`Apri scheda di ${fullName}`}
      className={styles.card}
      onClick={goToDetail}
      onKeyDown={(e) => e.key === 'Enter' && goToDetail()}
    >
      <header className={styles.header}>
        <div className={styles.avatar} aria-hidden="true">
          {client.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={client.photoUrl} alt="" className={styles.avatarImg} />
          ) : (
            <span className={styles.initials}>{initials || '·'}</span>
          )}
        </div>
        <div className={styles.identity}>
          <h3 className={styles.name}>{fullName}</h3>
          <div className={styles.sub}>
            {isNew ? (
              <span className={styles.nuovo}>
                <Sparkles className="w-3 h-3" /> Nuovo
              </span>
            ) : created ? (
              <span className={styles.since}>
                Cliente dal {new Date(created).toLocaleDateString('it-IT')}
              </span>
            ) : null}
            {isBirthdaySoon && (
              <Tooltip label={birthdayTooltip(daysToBday as number)}>
                <span className={styles.birthday}>
                  <Cake className="w-3 h-3" /> Compleanno
                </span>
              </Tooltip>
            )}
            {client.isTourist && (
              <span className={styles.tourist}>
                <Plane className="w-3 h-3" /> Turista
              </span>
            )}
            {client.hasIncompleteContact && <IncompleteContactBadge variant="pill" />}
          </div>
        </div>
      </header>

      <div className={styles.fields}>
        {client.email && (
          <div className={styles.field}>
            <Mail className="w-3.5 h-3.5" />
            <Tooltip label={client.email}>
              <span className={styles.fieldValue}>{client.email}</span>
            </Tooltip>
          </div>
        )}
        {client.phonePrefix && client.phoneNumber && (
          <div className={styles.field}>
            <Phone className="w-3.5 h-3.5" />
            <span className={styles.fieldValue}>{client.phonePrefix} {client.phoneNumber}</span>
          </div>
        )}
        {client.birthDate && (
          <div className={styles.field}>
            <Cake className="w-3.5 h-3.5" />
            <span className={styles.fieldValue}>
              {new Date(client.birthDate).toLocaleDateString('it-IT')}
            </span>
          </div>
        )}
        {!showArchived && client.hasIncompleteContact && (
          <button
            type="button"
            onClick={goToEditContact}
            className={styles.addContactCta}
          >
            <Plus className="w-3.5 h-3.5" />
            Aggiungi contatto
          </button>
        )}
      </div>

      <footer className={styles.foot}>
        <div className={styles.ratings}>
          <RatingRow icon={<Wallet />} label="Spesa" value={rating?.spend_stars ?? null} />
          <RatingRow icon={<CalendarDays />} label="Visite" value={rating?.visit_stars ?? null} />
        </div>
        {showArchived ? (
          <Tooltip label="Ripristina cliente">
            <button
              onClick={(e) => { e.stopPropagation(); onRestore?.(client); }}
              className={`${styles.btn} ${styles.btnRestore}`}
              aria-label="Ripristina cliente"
            ><ArchiveRestore className="w-3.5 h-3.5" /></button>
          </Tooltip>
        ) : (
          <Tooltip label="Elimina cliente">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(client); }}
              className={`${styles.btn} ${styles.btnDelete}`}
              aria-label="Elimina cliente"
            ><Trash className="w-3.5 h-3.5" /></button>
          </Tooltip>
        )}
      </footer>
    </div>
  );
}

function RatingRow({ icon, label, value }: { icon: ReactNode; label: string; value: number | null }) {
  const hasData = value !== null && value !== undefined;
  if (!hasData) {
    return (
      <Tooltip label={`${label} ancora non disponibile`}>
        <div
          className={`${styles.row} ${styles.rowEmpty}`}
          aria-label={`${label}: non disponibile`}
        >
          <span className={styles.rowIcon}>{icon}</span>
          <span className={styles.rowEmptyText}>
            {label}<span aria-hidden="true" className={styles.rowEmptyDash}>—</span>
          </span>
        </div>
      </Tooltip>
    );
  }
  return (
    <div className={styles.row}>
      <span className={styles.rowIcon}>{icon}</span>
      <span className={styles.rowLabel}>{label}</span>
      <div className={styles.bar} aria-label={`${label}: ${value} su 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`${styles.seg} ${i <= (value as number) ? styles.segOn : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
