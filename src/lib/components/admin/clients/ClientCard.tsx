'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plane, Mail, Phone, Cake, Archive, ArchiveRestore, Wallet, CalendarDays, CalendarClock, Plus, Sparkles,
} from 'lucide-react';
import type { Client } from '@/lib/types/Client';
import { useClientRatingsStore } from '@/lib/stores/client_ratings';
import { useClientStatsStore } from '@/lib/stores/client_stats';
import { usePreferencesStore } from '@/lib/stores/preferences';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { colorForClient } from '@/lib/utils/clientColor';
import { daysUntilBirthday } from '@/lib/utils/date';
import { FACTORY_PREFERENCES } from '@/lib/const/factory-defaults';
import { IncompleteContactBadge } from './IncompleteContactBadge';
import { BirthdayBadge } from './BirthdayBadge';
import styles from './ClientCard.module.css';

function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255);
  return `${hex}${a.toString(16).padStart(2, '0')}`;
}

interface ClientCardProps {
  client: Client;
  onArchive: (client: Client) => void;
  onRestore?: (client: Client) => void;
  showArchived?: boolean;
}

const NEW_CLIENT_DAYS = 14;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  return (Date.now() - date.getTime()) / MS_PER_DAY;
}

export function ClientCard({ client, onArchive, onRestore, showArchived = false }: ClientCardProps) {
  const router = useRouter();
  const rating = useClientRatingsStore((s) => s.ratings[client.id]);
  const lastVisit = useClientStatsStore((s) => s.stats[client.id]?.last_visit) ?? null;
  const birthdayReminder =
    usePreferencesStore((s) => s.preferences.clientsTable?.birthdayReminder) ??
    FACTORY_PREFERENCES.clientsTable.birthdayReminder;
  const created = (client as unknown as { created_at?: string }).created_at;
  const initials = `${client.firstName?.[0] ?? ''}${client.lastName?.[0] ?? ''}`.toUpperCase();
  const fullName = `${client.firstName} ${client.lastName}`.trim();

  const sinceCreated = daysSince(created);
  const isNew = sinceCreated !== null && sinceCreated <= NEW_CLIENT_DAYS;
  const daysToBday =
    birthdayReminder.enabled && client.birthDate ? daysUntilBirthday(client.birthDate) : null;

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
        <div
          className={styles.avatar}
          aria-hidden="true"
          style={
            client.photoUrl
              ? { borderColor: colorForClient(client), borderWidth: 2 }
              : { backgroundColor: withAlpha(colorForClient(client), 0.18) }
          }
        >
          {client.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={client.photoUrl} alt="" className={styles.avatarImg} />
          ) : (
            <span className={styles.initials} style={{ color: colorForClient(client) }}>
              {initials || '·'}
            </span>
          )}
        </div>
        <div className={styles.identity}>
          <h3 className={styles.name}>{fullName}</h3>
          <div className={styles.sub}>
            {client.phonePrefix && client.phoneNumber && (
              <span
                className={`${styles.phone} ${styles.link}`}
                onClick={(e) => {
                  e.stopPropagation();
                  const phone = `${client.phonePrefix}${client.phoneNumber}`.replace(/[^0-9]/g, '');
                  window.open(`https://wa.me/${phone}`, '_blank');
                }}
              >
                <Phone className="w-3 h-3" /> {client.phonePrefix} {client.phoneNumber}
              </span>
            )}
            {isNew ? (
              <span className={styles.nuovo}>
                <Sparkles className="w-3 h-3" /> Nuovo
              </span>
            ) : created ? (
              <span className={styles.since}>
                Cliente dal {new Date(created).toLocaleDateString('it-IT')}
              </span>
            ) : null}
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
              <span
                className={`${styles.fieldValue} ${styles.link}`}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`mailto:${client.email}`, '_blank');
                }}
              >
                {client.email}
              </span>
            </Tooltip>
          </div>
        )}
        {lastVisit && (
          <div className={styles.field}>
            <CalendarClock className="w-3.5 h-3.5" />
            <span className={styles.fieldValue}>
              {lastVisit.toLocaleDateString('it-IT')}
            </span>
          </div>
        )}
        {client.birthDate && (
          <div className={styles.field}>
            <Cake className="w-3.5 h-3.5" />
            <span className={styles.birthdateValue}>
              <span className={styles.fieldValue}>
                {new Date(client.birthDate).toLocaleDateString('it-IT')}
              </span>
              {daysToBday !== null && daysToBday <= birthdayReminder.daysAhead && (
                <BirthdayBadge daysLeft={daysToBday} />
              )}
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
          <Tooltip label="Archivia cliente">
            <button
              onClick={(e) => { e.stopPropagation(); onArchive(client); }}
              className={`${styles.btn} ${styles.btnArchive}`}
              aria-label="Archivia cliente"
            ><Archive className="w-3.5 h-3.5" /></button>
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
