import { parsePhone } from '../../core/transforms';
import type { ColumnMapping, EntityImportConfig, RowResult } from '../types';

type DestField = 'name' | 'city' | 'phoneRaw' | 'email';

interface SupplierRow extends Record<string, unknown> {
  name: string;
  city: string | null;
  phone: string | null;
  email: string | null;
}

const DICTIONARY = {
  name:     ['nome', 'fornitore', 'supplier', 'name', 'ragione sociale'],
  city:     ['città', 'citta', 'city', 'comune', 'località'],
  phoneRaw: ['telefono', 'phone', 'cellulare', 'tel', 'recapito'],
  email:    ['email', 'e-mail', 'mail', 'indirizzo email'],
};

function transformRow(
  source: Record<string, string>,
  mappings: ColumnMapping[],
  rowIndex: number,
): RowResult<SupplierRow> {
  const dest: Partial<Record<DestField, string>> = {};
  for (const m of mappings) {
    if (!m.destField || m.confidence < 0.6) continue;
    const value = source[m.sourceColumn];
    if (value == null || value === '') continue;
    dest[m.destField as DestField] = value;
  }
  const name = dest.name?.trim() ?? '';
  if (!name) {
    return { ok: false, rowIndex, reason: 'nome mancante', rawValues: source, partialRow: { name, city: dest.city ?? null, phone: null, email: dest.email ?? null } };
  }
  // Suppliers store the phone as a single string; reformat as `+CC NUMBER` when parseable
  let phone: string | null = null;
  if (dest.phoneRaw) {
    const parsed = parsePhone(dest.phoneRaw);
    phone = parsed.phoneNumber ? `${parsed.phonePrefix ?? ''} ${parsed.phoneNumber}`.trim() : dest.phoneRaw.trim();
  }
  const email = dest.email ? dest.email.trim().toLowerCase() : null;
  return {
    ok: true,
    row: {
      name,
      city: dest.city?.trim() || null,
      phone,
      email,
    },
  };
}

export const suppliersConfig: EntityImportConfig<SupplierRow> = {
  entity: 'suppliers',
  table: 'suppliers',
  italianLabel: 'Fornitori',
  destFields: Object.keys(DICTIONARY),
  destFieldLabels: {
    name: 'Nome',
    city: 'Città',
    phoneRaw: 'Telefono',
    email: 'Email',
  },
  hasRequiredCoverage: (mappings) => {
    const mapped = new Set(mappings.filter((m) => m.confidence >= 0.6).map((m) => m.destField));
    return mapped.has('name');
  },
  insufficientMappingReason: 'Impossibile identificare la colonna del nome fornitore.',
  dictionary: DICTIONARY,
  llmFieldDescriptions: {
    name: 'supplier company name',
    city: 'city / town',
    phoneRaw: 'phone number (any format)',
    email: 'contact email',
  },
  llmDomainHint: 'salon product suppliers (distributors, wholesalers)',
  transformRow,
  dedupKeys: [{ rowField: 'name', column: 'name', normalize: 'lower-trim' }],
  buildInsertPayload: (row, { salonId }) => ({
    salon_id: salonId,
    name: row.name,
    city: row.city,
    phone: row.phone,
    email: row.email,
  }),
  previewColumns: [
    { key: 'name', label: 'Nome' },
    { key: 'city', label: 'Città' },
    { key: 'phone', label: 'Telefono' },
    { key: 'email', label: 'Email' },
  ],
  redirectAfterCompletion: '/admin/magazzino?tab=fornitori',
};
