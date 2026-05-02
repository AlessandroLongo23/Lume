import { DEFAULT_CATEGORY_COLOR } from '@/lib/const/category-colors';
import type { ColumnMapping, EntityImportConfig, RowResult } from '../types';

type DestField = 'name' | 'description' | 'color';

interface ServiceCategoryRow extends Record<string, unknown> {
  name: string;
  description: string | null;
  color: string | null;
}

const DICTIONARY = {
  name:        ['nome', 'categoria', 'name', 'category'],
  description: ['descrizione', 'description', 'note'],
  color:       ['colore', 'color', 'hex'],
};

function transformRow(
  source: Record<string, string>,
  mappings: ColumnMapping[],
  rowIndex: number,
): RowResult<ServiceCategoryRow> {
  const dest: Partial<Record<DestField, string>> = {};
  for (const m of mappings) {
    if (!m.destField || m.confidence < 0.6) continue;
    const value = source[m.sourceColumn];
    if (value == null || value === '') continue;
    dest[m.destField as DestField] = value;
  }
  const name = dest.name?.trim() ?? '';
  if (!name) {
    return { ok: false, rowIndex, reason: 'nome mancante', rawValues: source, partialRow: { name, description: dest.description ?? null, color: null } };
  }
  // Accept either #RRGGBB or RRGGBB; anything else falls back to the default at insert time
  let color: string | null = null;
  if (dest.color) {
    const v = dest.color.trim().replace(/^#?/, '#');
    if (/^#[0-9a-fA-F]{6}$/.test(v)) color = v.toLowerCase();
  }
  return {
    ok: true,
    row: {
      name,
      description: dest.description?.trim() || null,
      color,
    },
  };
}

export const serviceCategoriesConfig: EntityImportConfig<ServiceCategoryRow> = {
  entity: 'serviceCategories',
  table: 'service_categories',
  italianLabel: 'Categorie servizi',
  destFields: Object.keys(DICTIONARY),
  destFieldLabels: {
    name: 'Nome',
    description: 'Descrizione',
    color: 'Colore (hex)',
  },
  hasRequiredCoverage: (mappings) => {
    const mapped = new Set(mappings.filter((m) => m.confidence >= 0.6).map((m) => m.destField));
    return mapped.has('name');
  },
  insufficientMappingReason: 'Impossibile identificare la colonna del nome categoria.',
  dictionary: DICTIONARY,
  llmFieldDescriptions: {
    name: 'category name (e.g. Taglio, Colore, Trattamenti)',
    description: 'optional free-text description',
    color: 'hex color (#RRGGBB) for the category badge',
  },
  llmDomainHint: 'salon service categories (used to group services in the booking UI)',
  transformRow,
  dedupKeys: [{ rowField: 'name', column: 'name', normalize: 'lower-trim' }],
  buildInsertPayload: (row, { salonId }) => ({
    salon_id: salonId,
    name: row.name,
    description: row.description,
    color: row.color ?? DEFAULT_CATEGORY_COLOR,
  }),
  previewColumns: [
    { key: 'name', label: 'Nome' },
    { key: 'description', label: 'Descrizione' },
    { key: 'color', label: 'Colore' },
  ],
  redirectAfterCompletion: '/admin/servizi?tab=categorie',
};
