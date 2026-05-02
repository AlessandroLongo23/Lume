import type { ColumnMapping, EntityImportConfig, RowResult } from '../types';

type DestField = 'name' | 'description';

interface ProductCategoryRow extends Record<string, unknown> {
  name: string;
  description: string | null;
}

const DICTIONARY = {
  name:        ['nome', 'categoria', 'name', 'category'],
  description: ['descrizione', 'description', 'note', 'commento'],
};

const REQUIRED: DestField[] = ['name'];

function transformRow(
  source: Record<string, string>,
  mappings: ColumnMapping[],
  rowIndex: number,
): RowResult<ProductCategoryRow> {
  const dest: Partial<Record<DestField, string>> = {};
  for (const m of mappings) {
    if (!m.destField || m.confidence < 0.6) continue;
    const value = source[m.sourceColumn];
    if (value == null || value === '') continue;
    dest[m.destField as DestField] = value;
  }
  const name = dest.name?.trim() ?? '';
  if (!name) {
    return { ok: false, rowIndex, reason: 'nome mancante', rawValues: source, partialRow: { name, description: dest.description ?? null } };
  }
  return {
    ok: true,
    row: { name, description: dest.description?.trim() || null },
  };
}

export const productCategoriesConfig: EntityImportConfig<ProductCategoryRow> = {
  entity: 'productCategories',
  table: 'product_categories',
  italianLabel: 'Categorie prodotti',
  destFields: Object.keys(DICTIONARY),
  destFieldLabels: { name: 'Nome', description: 'Descrizione' },
  hasRequiredCoverage: (mappings) => {
    const mapped = new Set(mappings.filter((m) => m.confidence >= 0.6).map((m) => m.destField as DestField));
    return REQUIRED.every((f) => mapped.has(f));
  },
  insufficientMappingReason: 'Impossibile identificare la colonna del nome categoria.',
  dictionary: DICTIONARY,
  llmFieldDescriptions: {
    name: 'category name',
    description: 'optional free-text description',
  },
  llmDomainHint: 'salon product categories (e.g. shampoo, color, styling tools)',
  transformRow,
  dedupKeys: [{ rowField: 'name', column: 'name', normalize: 'lower-trim' }],
  buildInsertPayload: (row, { salonId }) => ({
    salon_id: salonId,
    name: row.name,
    description: row.description,
  }),
  previewColumns: [
    { key: 'name', label: 'Nome' },
    { key: 'description', label: 'Descrizione' },
  ],
  redirectAfterCompletion: '/admin/magazzino?tab=categorie',
};
