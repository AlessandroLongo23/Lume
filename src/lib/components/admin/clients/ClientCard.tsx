'use client';

import { useRouter } from 'next/navigation';
import { Plane, Mail, Phone, Calendar, Trash, ArchiveRestore, Wallet, CalendarDays } from 'lucide-react';
import type { Client } from '@/lib/types/Client';
import { useClientRatingsStore } from '@/lib/stores/client_ratings';
import styles from './ClientCard.module.css';

interface ClientCardProps {
  client: Client;
  onDelete: (client: Client) => void;
  onRestore?: (client: Client) => void;
  showArchived?: boolean;
}

const genderTint: Record<string, { fill: string; ink: string }> = {
  F: { fill: 'lab(94.5% 12 -3)', ink: 'lab(45% 50 -10)' },
  M: { fill: 'lab(94.5% -2 -10)', ink: 'lab(38% 6 -50)' },
};

const genderLabel: Record<string, string> = { M: 'Uomo', F: 'Donna' };

export function ClientCard({ client, onDelete, onRestore, showArchived = false }: ClientCardProps) {
  const router = useRouter();
  const rating = useClientRatingsStore((s) => s.ratings[client.id]);
  const tint = genderTint[client.gender];
  const created = (client as unknown as { created_at?: string }).created_at;

  return (
    <div
      id={`client-card-${client.id}`}
      role="button"
      tabIndex={0}
      className={styles.card}
      style={tint ? {
        ['--gender-fill' as string]: tint.fill,
        ['--gender-ink' as string]: tint.ink,
      } : undefined}
      onClick={() => router.push(`/admin/clienti/${client.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/admin/clienti/${client.id}`)}
    >
      <div className={styles.portrait}>
        <span className={styles.initials}>{client.firstName?.[0]}{client.lastName?.[0]}</span>
        <span className={styles.genderMark}>{genderLabel[client.gender] ?? 'Cliente'}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.head}>
          <h3 className={styles.name}>{client.firstName} {client.lastName}</h3>
          <div className={styles.sub}>
            {client.isTourist && (
              <span className={styles.tourist}><Plane className="w-3 h-3" /> Turista</span>
            )}
            <span>
              {created
                ? `Cliente dal ${new Date(created).toLocaleDateString('it-IT')}`
                : 'Cliente'}
            </span>
          </div>
        </div>

        <div className={styles.fields}>
          {client.email && (
            <div className={styles.field}>
              <Mail className="w-3.5 h-3.5" />
              <span className={styles.fieldValue} title={client.email}>{client.email}</span>
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
              <Calendar className="w-3.5 h-3.5" />
              <span className={styles.fieldValue}>{new Date(client.birthDate).toLocaleDateString('it-IT')}</span>
            </div>
          )}
        </div>

        <div className={styles.foot}>
          <div className={styles.ratings}>
            <div className={`${styles.row} ${styles.rowEmerald}`}>
              <Wallet />
              <span className={styles.label}>Spesa</span>
              <div className={styles.bar} aria-label={`Spesa: ${rating?.spend_stars ?? 0} su 5`}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className={`${styles.seg} ${i <= (rating?.spend_stars ?? 0) ? styles.segOnEmerald : ''}`}
                  />
                ))}
              </div>
            </div>
            <div className={`${styles.row} ${styles.rowSky}`}>
              <CalendarDays />
              <span className={styles.label}>Visite</span>
              <div className={styles.bar} aria-label={`Visite: ${rating?.visit_stars ?? 0} su 5`}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className={`${styles.seg} ${i <= (rating?.visit_stars ?? 0) ? styles.segOnSky : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>
          {showArchived ? (
            <button
              onClick={(e) => { e.stopPropagation(); onRestore?.(client); }}
              className={`${styles.btn} ${styles.btnRestore}`}
              title="Ripristina cliente"
            ><ArchiveRestore className="w-3.5 h-3.5" /></button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(client); }}
              className={`${styles.btn} ${styles.btnDelete}`}
              title="Elimina cliente"
            ><Trash className="w-3.5 h-3.5" /></button>
          )}
        </div>
      </div>
    </div>
  );
}
