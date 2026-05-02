import type { ColumnMapping, EntityImportConfig, RowResult } from '../types';

type DestField = 'name';

interface ManufacturerRow extends Record<string, unknown> {
  name: string;
}

const DICTIONARY = {
  name: ['nome', 'marchio', 'produttore', 'brand', 'name', 'manufacturer'],
};

function transformRow(
  source: Record<string, string>,
  mappings: ColumnMapping[],
  rowIndex: number,
): RowResult<ManufacturerRow> {
  const dest: Partial<Record<DestField, string>> = {};
  for (const m of mappings) {
    if (!m.destField || m.confidence < 0.6) continue;
    const value = source[m.sourceColumn];
    if (value == null || value === '') continue;
    dest[m.destField as DestField] = value;
  }
  const name = dest.name?.trim() ?? '';
  if (!name) {
    return { ok: false, rowIndex, reason: 'nome mancante', rawValues: source, partialRow: { name } };
  }
  return { ok: true, row: { name } };
}

export const manufacturersConfig: EntityImportConfig<ManufacturerRow> = {
  entity: 'manufacturers',
  table: 'manufacturers',
  italianLabel: 'Marchi',
  destFields: Object.keys(DICTIONARY),
  destFieldLabels: { name: 'Nome / Marchio' },
  hasRequiredCoverage: (mappings) => {
    const mapped = new Set(mappings.filter((m) => m.confidence >= 0.6).map((m) => m.destField));
    return mapped.has('name');
  },
  insufficientMappingReason: 'Impossibile identificare la colonna del nome marchio.',
  dictionary: DICTIONARY,
  llmFieldDescriptions: {
    name: 'manufacturer / brand name (e.g. Wella, L\'Oréal, Schwarzkopf)',
  },
  llmDomainHint: 'salon product manufacturers / brands',
  transformRow,
  dedupKeys: [{ rowField: 'name', column: 'name', normalize: 'lower-trim' }],
  buildInsertPayload: (row, { salonId }) => ({
    salon_id: salonId,
    name: row.name,
  }),
  previewColumns: [{ key: 'name', label: 'Nome' }],
  redirectAfterCompletion: '/admin/magazzino?tab=marchi',
};
