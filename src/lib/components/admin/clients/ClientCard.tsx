'use client';

import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, Archive, ArchiveRestore, Plus } from 'lucide-react';
import type { Client } from '@/lib/types/Client';
import { useClientStatsStore } from '@/lib/stores/client_stats';
import { usePreferencesStore } from '@/lib/stores/preferences';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { Button } from '@/lib/components/shared/ui/Button';
import { TextLink } from '@/lib/components/shared/ui/TextLink';
import { colorForClient } from '@/lib/utils/clientColor';
import { daysUntilBirthday } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils/format';
import { FACTORY_PREFERENCES } from '@/lib/const/factory-defaults';
import { IncompleteContactBadge } from './IncompleteContactBadge';
import { BirthdayBadge } from './BirthdayBadge';
import styles from './ClientCard.module.css';

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
  const stat = useClientStatsStore((s) => s.stats[client.id]);
  const lastVisit = stat?.last_visit ?? null;
  const visitCount = stat?.visit_count ?? 0;
  const totalSpent = stat?.total_spent ?? 0;
  const birthdayReminder =
    usePreferencesStore((s) => s.preferences.clientsTable?.birthdayReminder) ??
    FACTORY_PREFERENCES.clientsTable.birthdayReminder;
  const created = client.created_at;
  const initials = `${client.firstName?.[0] ?? ''}${client.lastName?.[0] ?? ''}`.toUpperCase();
  const fullName = `${client.firstName} ${client.lastName}`.trim();
  const hasPhone = Boolean(client.phonePrefix && client.phoneNumber);

  const sinceCreated = daysSince(created);
  const isNew = sinceCreated !== null && sinceCreated <= NEW_CLIENT_DAYS;
  const daysToBday =
    birthdayReminder.enabled && client.birthDate ? daysUntilBirthday(client.birthDate) : null;

  const goToDetail = () => router.push(`/admin/clienti/${client.id}`);
  const goToEditContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/admin/clienti/${client.id}?edit=${client.id}`);
  };
  // A contact link opens WhatsApp or mail; its click and Enter must not also open the card.
  const stopCardActivation = (e: React.SyntheticEvent) => e.stopPropagation();

  // The client's own colour, as a soft tint on the avatar (see ClientCard.module.css).
  const tint = { '--client-color': colorForClient(client) } as CSSProperties;

  return (
    <div
      id={`client-card-${client.id}`}
      role="button"
      tabIndex={0}
      aria-label={`Apri scheda di ${fullName}`}
      className={styles.card}
      onClick={goToDetail}
      onKeyDown={(e) => {
        // Only the card itself: Enter on a button or link inside it does that control's job.
        if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault();
        goToDetail();
      }}
    >
      <header className={styles.header}>
        <div
          className={`${styles.avatar} ${client.photoUrl ? styles.avatarPhoto : ''}`}
          aria-hidden="true"
          style={tint}
        >
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
              <span className={styles.state}>
                <span className={`${styles.dot} ${styles.dotInfo}`} aria-hidden /> Nuovo
              </span>
            ) : created ? (
              <span>
                Cliente dal {new Date(created).toLocaleDateString('it-IT')}
              </span>
            ) : null}
            {client.isTourist && (
              <span className={styles.state}>
                <Plane className={styles.subIcon} aria-hidden /> Turista
              </span>
            )}
            {client.hasIncompleteContact && <IncompleteContactBadge variant="dot" />}
          </div>
        </div>
      </header>

      <div className={styles.fields}>
        {hasPhone && (
          <TextLink
            quiet
            href={`https://wa.me/${`${client.phonePrefix}${client.phoneNumber}`.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.contact} ${styles.mono} ${styles.link}`}
            onClick={stopCardActivation}
            onKeyDown={stopCardActivation}
          >
            {client.phonePrefix} {client.phoneNumber}
          </TextLink>
        )}
        {client.email && (
          <Tooltip label={client.email}>
            <TextLink
              quiet
              href={`mailto:${client.email}`}
              target="_blank"
              className={`${styles.contact} ${styles.link}`}
              onClick={stopCardActivation}
              onKeyDown={stopCardActivation}
            >
              {client.email}
            </TextLink>
          </Tooltip>
        )}
        {(lastVisit || client.birthDate) && (
          <dl className={styles.facts}>
            {lastVisit && (
              <div className={styles.fact}>
                <dt>Ultima visita</dt>
                <dd className={styles.mono}>{lastVisit.toLocaleDateString('it-IT')}</dd>
              </div>
            )}
            {client.birthDate && (
              <div className={styles.fact}>
                <dt>Compleanno</dt>
                <dd>
                  <span className={styles.mono}>{new Date(client.birthDate).toLocaleDateString('it-IT')}</span>
                  {daysToBday !== null && daysToBday <= birthdayReminder.daysAhead && (
                    <BirthdayBadge daysLeft={daysToBday} />
                  )}
                </dd>
              </div>
            )}
          </dl>
        )}
        {!showArchived && client.hasIncompleteContact && (
          <Button
            // ds-ignore: a labelled sm Button keeps 32px on touch (only md and icon-only sm grow), so this one asks for the 44px target itself
            variant="secondary"
            size="sm"
            leadingIcon={Plus}
            onClick={goToEditContact}
            className="self-start mt-1 pointer-coarse:h-11"
          >
            Aggiungi contatto
          </Button>
        )}
      </div>

      <footer className={styles.foot}>
        {visitCount > 0 ? (
          <p className={styles.stats}>
            <span className={styles.statValue}>{visitCount}</span> {visitCount === 1 ? 'visita' : 'visite'}
            <span className={styles.statSep} aria-hidden>·</span>
            <span className={styles.statValue}>{formatCurrency(totalSpent)}</span>
          </p>
        ) : (
          <p className={styles.stats}>Nessuna visita</p>
        )}
        {showArchived ? (
          <Button
            variant="ghost"
            iconOnly
            onClick={(e) => { e.stopPropagation(); onRestore?.(client); }}
            className={`${styles.reveal} transition-[background-color,color,opacity,scale]`}
            aria-label="Ripristina cliente"
          ><ArchiveRestore /></Button>
        ) : (
          <Button
            variant="ghost"
            iconOnly
            onClick={(e) => { e.stopPropagation(); onArchive(client); }}
            className={`${styles.reveal} transition-[background-color,color,opacity,scale]`}
            aria-label="Archivia cliente"
          ><Archive /></Button>
        )}
      </footer>
    </div>
  );
}
