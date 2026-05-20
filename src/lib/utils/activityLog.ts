import type { ActivityLog, ActivityAction } from '@/lib/types/ActivityLog';
import { formatDateDisplay } from '@/lib/utils/format';
import { useClientsStore } from '@/lib/stores/clients';
import { useOperatorsStore } from '@/lib/stores/operators';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { useProductsStore } from '@/lib/stores/products';
import { useManufacturersStore } from '@/lib/stores/manufacturers';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { useFichesStore } from '@/lib/stores/fiches';
import { useFicheServicesStore } from '@/lib/stores/fiche_services';
import { useFicheProductsStore } from '@/lib/stores/fiche_products';

/**
 * Plain-Italian rendering of activity-log rows. Entries written by the
 * service-role routes already carry a human `summary`; entries captured by the
 * DB trigger (browser-direct writes) don't, so we build the sentence here from
 * the entity type, action and field diff.
 */

type EntityNoun = { indef: string; def: string; label: string };

const ENTITY_NOUNS: Record<string, EntityNoun> = {
  clients: { indef: 'un cliente', def: 'il cliente', label: 'Clienti' },
  fiches: { indef: 'una fiche', def: 'la fiche', label: 'Fiches' },
  fiche_services: { indef: 'un servizio in fiche', def: 'il servizio in fiche', label: 'Servizi in fiche' },
  fiche_products: { indef: 'un prodotto in fiche', def: 'il prodotto in fiche', label: 'Prodotti in fiche' },
  fiche_payments: { indef: 'un pagamento', def: 'il pagamento', label: 'Pagamenti' },
  services: { indef: 'un servizio', def: 'il servizio', label: 'Servizi' },
  service_categories: { indef: 'una categoria di servizi', def: 'la categoria di servizi', label: 'Categorie servizi' },
  service_products: { indef: 'un prodotto di servizio', def: 'il prodotto di servizio', label: 'Prodotti servizio' },
  products: { indef: 'un prodotto', def: 'il prodotto', label: 'Prodotti' },
  product_categories: { indef: 'una categoria di prodotti', def: 'la categoria di prodotti', label: 'Categorie prodotti' },
  operators: { indef: 'un operatore', def: "l'operatore", label: 'Operatori' },
  operator_services: { indef: 'un servizio operatore', def: 'il servizio operatore', label: 'Servizi operatore' },
  operator_unavailabilities: { indef: "un'indisponibilità", def: "l'indisponibilità", label: 'Indisponibilità' },
  coupons: { indef: 'un coupon', def: 'il coupon', label: 'Coupon' },
  coupon_redemptions: { indef: 'un utilizzo di coupon', def: "l'utilizzo di coupon", label: 'Utilizzi coupon' },
  orders: { indef: 'un ordine', def: "l'ordine", label: 'Ordini' },
  order_products: { indef: 'una voce di ordine', def: 'la voce di ordine', label: 'Voci ordine' },
  abbonamenti: { indef: 'un abbonamento', def: "l'abbonamento", label: 'Abbonamenti' },
  manufacturers: { indef: 'un produttore', def: 'il produttore', label: 'Produttori' },
  suppliers: { indef: 'un fornitore', def: 'il fornitore', label: 'Fornitori' },
  obiettivi: { indef: 'un obiettivo', def: "l'obiettivo", label: 'Obiettivi' },
  salon_closures: { indef: 'una chiusura', def: 'la chiusura', label: 'Chiusure' },
  spese: { indef: 'una spesa', def: 'la spesa', label: 'Spese' },
  user_salon_memberships: { indef: 'un membro del team', def: 'il membro del team', label: 'Accessi team' },
};

export function entityLabel(entityType: string): string {
  return ENTITY_NOUNS[entityType]?.label ?? entityType;
}

const ACTION_VERBS: Record<ActivityAction, string> = {
  create: 'ha aggiunto',
  update: 'ha modificato',
  delete: 'ha eliminato',
  bulk: 'ha aggiornato in blocco',
};

export function actionLabel(action: ActivityAction): string {
  const labels: Record<ActivityAction, string> = {
    create: 'Creazione',
    update: 'Modifica',
    delete: 'Eliminazione',
    bulk: 'Blocco',
  };
  return labels[action] ?? action;
}

const FIELD_LABELS: Record<string, string> = {
  name: 'nome', firstName: 'nome', lastName: 'cognome',
  price: 'prezzo', sell_price: 'prezzo di vendita', product_cost: 'costo',
  duration: 'durata', description: 'descrizione', note: 'note', notes: 'note',
  status: 'stato', archived_at: 'archiviazione', datetime: 'data e ora',
  start_time: 'inizio', end_time: 'fine',
  client_id: 'cliente', recipient_client_id: 'destinatario', purchaser_client_id: 'acquirente',
  operator_id: 'operatore', service_id: 'servizio', product_id: 'prodotto',
  category_id: 'categoria', service_category_id: 'categoria', product_category_id: 'categoria',
  manufacturer_id: 'produttore', supplier_id: 'fornitore', abbonamento_id: 'abbonamento',
  stock_quantity: 'giacenza', stock: 'giacenza',
  min_threshold: 'soglia minima', email: 'email', phoneNumber: 'telefono',
  phonePrefix: 'prefisso', total_paid: 'totale incassato', total_override: 'totale',
  valid_until: 'scadenza', valid_from: 'inizio validità', discount_value: 'sconto',
  discount_percent: 'sconto %', is_active: 'attivo', color: 'colore', paid: 'pagato',
  miscela: 'miscela', tecnica: 'tecnica',
  bookable_online: 'prenotabile online', can_book_online: 'prenotabile online',
  is_for_retail: 'in vendita',
};

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

// Resolve a foreign-key value to a human name using the already-hydrated stores.
// Returns null when the referenced row isn't loaded (e.g. it was deleted).
function clientName(id: string): string | null {
  const c = useClientsStore.getState().clients.find((x) => x.id === id);
  return c ? (`${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || null) : null;
}
function operatorName(id: string): string | null {
  const o = useOperatorsStore.getState().operators.find((x) => x.id === id);
  return o ? (`${o.firstName ?? ''} ${o.lastName ?? ''}`.trim() || null) : null;
}
function byName(arr: { id: string; name?: string | null }[], id: string): string | null {
  return arr.find((x) => x.id === id)?.name?.trim() || null;
}

const REF_RESOLVERS: Record<string, (id: string) => string | null> = {
  client_id: clientName,
  recipient_client_id: clientName,
  purchaser_client_id: clientName,
  operator_id: operatorName,
  service_id: (id) => byName(useServicesStore.getState().services, id),
  product_id: (id) => byName(useProductsStore.getState().products, id),
  category_id: (id) => byName(useServiceCategoriesStore.getState().service_categories, id),
  service_category_id: (id) => byName(useServiceCategoriesStore.getState().service_categories, id),
  product_category_id: (id) => byName(useProductCategoriesStore.getState().product_categories, id),
  manufacturer_id: (id) => byName(useManufacturersStore.getState().manufacturers, id),
  supplier_id: (id) => byName(useSuppliersStore.getState().suppliers, id),
};

// Resolve the entry's own subject (entity_type + entity_id) to a name, so a
// trigger-captured edit can read "ha modificato il servizio Taglio".
const ENTITY_NAME_RESOLVERS: Record<string, (id: string) => string | null> = {
  clients: clientName,
  operators: operatorName,
  services: (id) => byName(useServicesStore.getState().services, id),
  products: (id) => byName(useProductsStore.getState().products, id),
  service_categories: (id) => byName(useServiceCategoriesStore.getState().service_categories, id),
  product_categories: (id) => byName(useProductCategoriesStore.getState().product_categories, id),
  manufacturers: (id) => byName(useManufacturersStore.getState().manufacturers, id),
  suppliers: (id) => byName(useSuppliersStore.getState().suppliers, id),
};

function entityName(entry: ActivityLog): string | null {
  if (!entry.entity_id) return null;
  const resolver = ENTITY_NAME_RESOLVERS[entry.entity_type];
  return resolver ? resolver(entry.entity_id) : null;
}

// Relationship lookups for fiche-scoped rows.
function ficheClientName(ficheId: string | null | undefined): string | null {
  if (!ficheId) return null;
  const f = useFichesStore.getState().fiches.find((x) => x.id === ficheId);
  return f ? clientName(f.client_id) : null;
}
function ficheServiceRow(id: string | null) {
  if (!id) return null;
  return useFicheServicesStore.getState().fiche_services.find((x) => x.id === id) ?? null;
}
function ficheProductRow(id: string | null) {
  if (!id) return null;
  return useFicheProductsStore.getState().fiche_products.find((x) => x.id === id) ?? null;
}

/**
 * The natural-language subject of the entry, e.g.
 *   "il cliente Mario Rossi", "la fiche di Mario Rossi",
 *   "il servizio Taglio nella fiche di Mario Rossi".
 */
function subjectPhrase(entry: ActivityLog): string {
  const def = entry.action !== 'create';
  const noun = ENTITY_NOUNS[entry.entity_type];
  const base = def ? (noun?.def ?? entry.entity_type) : (noun?.indef ?? entry.entity_type);

  if (entry.entity_type === 'fiches') {
    const client = ficheClientName(entry.entity_id);
    return client ? `${base} di ${client}` : base;
  }

  if (entry.entity_type === 'fiche_services') {
    const row = ficheServiceRow(entry.entity_id);
    const svc = row ? byName(useServicesStore.getState().services, row.service_id) : null;
    const client = row ? ficheClientName(row.fiche_id) : null;
    let s = def ? 'il servizio' : 'un servizio';
    if (svc) s += ` ${svc}`;
    s += client ? ` nella fiche di ${client}` : ' in fiche';
    return s;
  }

  if (entry.entity_type === 'fiche_products') {
    const row = ficheProductRow(entry.entity_id);
    const prod = row ? byName(useProductsStore.getState().products, row.product_id) : null;
    const client = row ? ficheClientName(row.fiche_id) : null;
    let s = def ? 'il prodotto' : 'un prodotto';
    if (prod) s += ` ${prod}`;
    s += client ? ` nella fiche di ${client}` : ' in fiche';
    return s;
  }

  const name = entityName(entry);
  return name ? `${base} ${name}` : base;
}

// Fields that carry a time-of-day worth showing (vs. date-only fields).
const TIME_FIELDS = new Set(['datetime', 'start_time', 'end_time']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatValue(field: string, v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'sì' : 'no';
  if (typeof v === 'object') return '…';
  const s = String(v);

  const resolver = REF_RESOLVERS[field];
  if (resolver && UUID_RE.test(s)) {
    return resolver(s) ?? '—';
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const fmt = TIME_FIELDS.has(field) ? 'd MMM yyyy, HH:mm' : 'd MMM yyyy';
    try { return formatDateDisplay(s, fmt); } catch { /* fall through */ }
  }

  return s.length > 60 ? `${s.slice(0, 60)}…` : s;
}

type ChangeEntry = { old: unknown; new: unknown };

function isDiffMap(changes: unknown): changes is Record<string, ChangeEntry> {
  if (!changes || typeof changes !== 'object') return false;
  const values = Object.values(changes as Record<string, unknown>);
  if (values.length === 0) return false;
  return values.every(
    (v) => v !== null && typeof v === 'object' && 'old' in (v as object) && 'new' in (v as object),
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toDateInput(v: unknown): string | Date | null {
  if (v === null || v === undefined || v === '') return null;
  return v instanceof Date ? v : String(v);
}

function fmtTimeRange(start: unknown, end: unknown): string {
  const s = toDateInput(start);
  const e = toDateInput(end);
  if (s && e) {
    const sDate = formatDateDisplay(s, 'd MMM yyyy');
    const eDate = formatDateDisplay(e, 'd MMM yyyy');
    const sTime = formatDateDisplay(s, 'HH:mm');
    const eTime = formatDateDisplay(e, 'HH:mm');
    return sDate === eDate ? `${sDate}, ${sTime} – ${eTime}` : `${sDate} ${sTime} – ${eDate} ${eTime}`;
  }
  if (s) return formatDateDisplay(s, 'd MMM yyyy, HH:mm');
  if (e) return formatDateDisplay(e, 'd MMM yyyy, HH:mm');
  return '—';
}

/** A single change to render: a before→after diff, or a snapshot value. */
export type ActivityChange = { label: string; before?: string; after: string; isDiff: boolean };

const SNAPSHOT_SKIP = new Set([
  'id', 'salon_id', 'created_at', 'updated_at', 'updated_by', 'user_id', 'ids', 'patch', 'fiche_id',
]);

/**
 * Structured, human-readable list of what changed, for the detail accordion.
 * `start_time` + `end_time` are merged into one "Data e orario" range with a
 * before/after comparison; the unchanged side is filled from the live row.
 */
export function activityChanges(entry: ActivityLog): ActivityChange[] {
  const c = entry.changes;
  if (!c || typeof c !== 'object') return [];

  const map = new Map<string, { old?: unknown; hasOld: boolean; new: unknown }>();
  if (isDiffMap(c)) {
    for (const [k, v] of Object.entries(c)) map.set(k, { old: v.old, hasOld: true, new: v.new });
  } else {
    for (const [k, v] of Object.entries(c as Record<string, unknown>)) {
      if (SNAPSHOT_SKIP.has(k) || v === null || v === undefined || v === '') continue;
      map.set(k, { hasOld: false, new: v });
    }
  }

  const out: ActivityChange[] = [];

  if (map.has('start_time') || map.has('end_time')) {
    const st = map.get('start_time');
    const en = map.get('end_time');
    map.delete('start_time');
    map.delete('end_time');
    const row = entry.entity_type === 'fiche_services' ? ficheServiceRow(entry.entity_id) : null;
    const stNew = st ? st.new : row?.start_time;
    const enNew = en ? en.new : row?.end_time;
    const isDiff = Boolean(st?.hasOld || en?.hasOld);
    out.push({
      label: 'Data e orario',
      before: isDiff
        ? fmtTimeRange(st?.hasOld ? st.old : stNew, en?.hasOld ? en.old : enNew)
        : undefined,
      after: fmtTimeRange(stNew, enNew),
      isDiff,
    });
  }

  for (const [k, v] of map) {
    out.push({
      label: capitalize(fieldLabel(k)),
      before: v.hasOld ? formatValue(k, v.old) : undefined,
      after: formatValue(k, v.new),
      isDiff: v.hasOld,
    });
  }
  return out;
}

/**
 * Short plain-Italian headline WITHOUT the actor (the UI prefixes the name) and
 * WITHOUT field-level detail (that lives in the expandable accordion). E.g.
 * "ha modificato il servizio Taglio nella fiche di Mario Rossi".
 */
export function describeActivity(entry: ActivityLog): string {
  if (entry.summary && entry.summary.trim()) return entry.summary.trim();
  return `${ACTION_VERBS[entry.action]} ${subjectPhrase(entry)}`;
}
