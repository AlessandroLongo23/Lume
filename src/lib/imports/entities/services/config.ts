import { parseNumber, parseInteger } from '../../core/transforms';
import { buildDestFromMappings } from '../../core/transformRowHelpers';
import type { ColumnMapping, EntityImportConfig, RowResult } from '../types';

type DestField =
  | 'name'
  | 'categoryName'
  | 'duration'
  | 'price'
  | 'productCost'
  | 'description';

interface ServiceRow extends Record<string, unknown> {
  name: string;
  categoryName: string | null;
  category_id: string | null; // populated by the FK resolver
  duration: number;
  price: number;
  productCost: number;
  description: string | null;
}

const DEST_FIELDS = [
  'name',
  'categoryName',
  'duration',
  'price',
  'productCost',
  'description',
] as const satisfies readonly DestField[];

const DICTIONARY = {
  name:         ['nome', 'servizio', 'service', 'name', 'prestazione'],
  categoryName: ['categoria', 'category', 'reparto', 'gruppo'],
  duration:     ['durata', 'duration', 'minuti', 'tempo', 'min'],
  price:        ['prezzo', 'price', 'tariffa', 'costo'],
  productCost:  ['costo prodotti', 'product cost', 'costo prodotto', 'costo materiale'],
  description:  ['descrizione', 'description', 'note', 'commento'],
};

function coerceNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (v == null) return null;
  return parseNumber(String(v));
}
function coerceInteger(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v);
  if (v == null) return null;
  return parseInteger(String(v));
}
function coerceString(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function transformRow(
  source: Record<string, string>,
  mappings: ColumnMapping[],
  rowIndex: number,
): RowResult<ServiceRow> {
  const dest = buildDestFromMappings(source, mappings, DEST_FIELDS);

  const name = coerceString(dest.name) ?? '';
  const reasons: string[] = [];
  if (!name) reasons.push('nome mancante');

  const duration = coerceInteger(dest.duration) ?? 0;
  const price = coerceNumber(dest.price) ?? 0;
  const productCost = coerceNumber(dest.productCost) ?? 0;

  if (dest.duration != null && coerceInteger(dest.duration) == null) reasons.push('durata non valida');
  if (dest.price != null && coerceNumber(dest.price) == null) reasons.push('prezzo non valido');

  const candidate: ServiceRow = {
    name,
    categoryName: coerceString(dest.categoryName),
    category_id: null,
    duration,
    price,
    productCost,
    description: coerceString(dest.description),
  };

  if (reasons.length > 0) {
    return { ok: false, rowIndex, reason: reasons.join(', '), rawValues: source, partialRow: candidate };
  }
  return { ok: true, row: candidate };
}

export const servicesConfig: EntityImportConfig<ServiceRow> = {
  entity: 'services',
  table: 'services',
  italianLabel: 'Servizi',
  destFields: Object.keys(DICTIONARY),
  destFieldLabels: {
    name: 'Nome',
    categoryName: 'Categoria',
    duration: 'Durata (min)',
    price: 'Prezzo',
    productCost: 'Costo prodotti',
    description: 'Descrizione',
  },
  hasRequiredCoverage: (mappings) => {
    const mapped = new Set(mappings.filter((m) => m.confidence >= 0.6).map((m) => m.destField));
    return mapped.has('name');
  },
  insufficientMappingReason: 'Impossibile identificare la colonna del nome servizio.',
  dictionary: DICTIONARY,
  llmFieldDescriptions: {
    name: 'service name (e.g. "Taglio uomo", "Colore + piega")',
    categoryName: 'service category by name',
    duration: 'duration in minutes (integer)',
    price: 'price in euros',
    productCost: 'cost of products consumed during the service',
    description: 'optional free-text description',
  },
  llmDomainHint: 'salon services (treatments, cuts, color, etc.)',
  smartModeEnabled: true,
  smartHints: {
    description: 'Italian salon software exports often combine multiple fields in a single column.',
    examples: [
      {
        sourceColumnHint: 'Durata',
        explanation:
          "Mixed values like '30 min' / '1h30' / '45/60' may need a regex split or custom parsing into duration (minutes).",
      },
      {
        sourceColumnHint: 'Costo prodotti',
        explanation:
          "If the cell says 'incluso' / 'compreso' → productCost=0 + a literal flag elsewhere; numeric → productCost as number.",
      },
    ],
  },
  fkColumns: [
    { sourceField: 'categoryName', targetField: 'category_id', table: 'service_categories', matchField: 'name', autoCreate: true },
  ],
  transformRow,
  dedupKeys: [
    { rowField: 'name', column: 'name', normalize: 'lower-trim' },
  ],
  buildInsertPayload: (row, { salonId }) => ({
    salon_id: salonId,
    name: row.name,
    category_id: row.category_id,
    duration: row.duration,
    price: row.price,
    product_cost: row.productCost,
    description: row.description,
  }),
  previewColumns: [
    { key: 'name', label: 'Nome' },
    { key: 'categoryName', label: 'Categoria' },
    { key: 'duration', label: 'Durata' },
    { key: 'price', label: 'Prezzo' },
    { key: 'productCost', label: 'Costo prodotti' },
  ],
  redirectAfterCompletion: '/admin/servizi?tab=servizi',
};
