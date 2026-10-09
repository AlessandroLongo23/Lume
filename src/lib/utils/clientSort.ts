import type { Client } from '@/lib/types/Client';
import type { ClientStat } from '@/lib/types/ClientStat';

export type ClientSortKey =
  | 'name'
  | 'surname'
  | 'lastVisit'
  | 'absent'
  | 'newest'
  | 'spent'
  | 'visits';

export const CLIENT_SORT_OPTIONS: { value: ClientSortKey; label: string }[] = [
  { value: 'name', label: 'Nome (A-Z)' },
  { value: 'surname', label: 'Cognome (A-Z)' },
  { value: 'lastVisit', label: 'Ultima visita più recente' },
  { value: 'absent', label: 'Assenti da più tempo' },
  { value: 'newest', label: 'Aggiunti di recente' },
  { value: 'spent', label: 'Spesa più alta' },
  { value: 'visits', label: 'Più visite' },
];

const collator = new Intl.Collator('it', { sensitivity: 'base' });

function byName(a: Client, b: Client): number {
  return (
    collator.compare(a.firstName ?? '', b.firstName ?? '') ||
    collator.compare(a.lastName ?? '', b.lastName ?? '')
  );
}

function bySurname(a: Client, b: Client): number {
  return (
    collator.compare(a.lastName ?? '', b.lastName ?? '') ||
    collator.compare(a.firstName ?? '', b.firstName ?? '')
  );
}

/** Returns a sorted copy. Clients missing the sorted value (never visited,
 *  no stats yet) always go last; ties fall back to the name. */
export function sortClients(
  clients: Client[],
  key: ClientSortKey,
  stats: Record<string, ClientStat>,
): Client[] {
  if (key === 'name') return [...clients].sort(byName);
  if (key === 'surname') return [...clients].sort(bySurname);

  const value = (c: Client): number | null => {
    const s = stats[c.id];
    switch (key) {
      case 'lastVisit':
      case 'absent':
        return s?.last_visit?.getTime() ?? null;
      case 'newest':
        return c.created_at ? new Date(c.created_at).getTime() : null;
      case 'spent':
        return s?.total_spent ?? null;
      case 'visits':
        return s?.visit_count ?? null;
    }
  };
  const direction = key === 'absent' ? 1 : -1;

  return clients
    .map((client) => ({ client, v: value(client) }))
    .sort((a, b) => {
      if (a.v === null || b.v === null) {
        if (a.v === b.v) return byName(a.client, b.client);
        return a.v === null ? 1 : -1;
      }
      return (a.v - b.v) * direction || byName(a.client, b.client);
    })
    .map((x) => x.client);
}
