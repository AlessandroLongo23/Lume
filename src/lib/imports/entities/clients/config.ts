import type { EntityImportConfig, ColumnMapping } from '../types';
import { CLIENT_DICTIONARY, ALL_CLIENT_DEST_FIELDS, type ClientDestField } from './dictionary';
import { transformClientRow, type ClientInsertRow } from './schema';

const REQUIRED_FIELDS = new Set<ClientDestField>(['firstName', 'lastName']);
const FULLNAME_SATISFIES = new Set<ClientDestField>(['fullName']);

function hasClientCoverage(mappings: ColumnMapping[]): boolean {
  const mapped = new Set(mappings.filter((m) => m.confidence >= 0.6).map((m) => m.destField as ClientDestField));
  if (mapped.has('firstName') && mapped.has('lastName')) return true;
  // fullName satisfies both first/last via splitting
  for (const f of FULLNAME_SATISFIES) if (mapped.has(f)) return true;
  return Array.from(REQUIRED_FIELDS).every((r) => mapped.has(r));
}

const DEST_FIELD_LABELS: Record<ClientDestField, string> = {
  firstName: 'Nome',
  lastName: 'Cognome',
  fullName: 'Nome completo (verrà diviso)',
  email: 'Email',
  phoneRaw: 'Telefono (combinato)',
  phonePrefix: 'Prefisso telefonico',
  phoneNumber: 'Numero (senza prefisso)',
  gender: 'Sesso',
  birthDate: 'Data di nascita',
  isTourist: 'Cliente turista',
  note: 'Note',
};

const LLM_FIELD_DESCRIPTIONS: Record<ClientDestField, string> = {
  firstName: "customer's first/given name",
  lastName: "customer's last/family name",
  fullName: 'combined name in a single column (will be split downstream)',
  email: 'email',
  phoneRaw: 'a single phone column with prefix and number combined',
  phonePrefix: 'international dialing code only',
  phoneNumber: 'phone digits without prefix',
  gender: 'M/F or Italian equivalents (Maschio/Femmina) or honorifics (Sig./Sig.ra)',
  birthDate: 'any date column representing birth date',
  isTourist: 'boolean indicating tourist/non-resident customer',
  note: 'free-text notes / observations / preferences',
};

export const clientsConfig: EntityImportConfig<ClientInsertRow> = {
  entity: 'clients',
  table: 'clients',
  italianLabel: 'Clienti',
  destFields: ALL_CLIENT_DEST_FIELDS,
  destFieldLabels: DEST_FIELD_LABELS,
  hasRequiredCoverage: hasClientCoverage,
  insufficientMappingReason:
    'Impossibile identificare nome e cognome con sufficiente certezza.',
  dictionary: CLIENT_DICTIONARY,
  llmFieldDescriptions: LLM_FIELD_DESCRIPTIONS,
  llmDomainHint: 'salon clients (data di nascita, contatto, sesso, note)',
  transformRow: transformClientRow,
  dedupKeys: [
    { rowField: 'email', column: 'email', normalize: 'lower' },
    { rowField: 'phoneNumber', column: 'phoneNumber' },
  ],
  buildInsertPayload: (row, { salonId }) => ({
    salon_id: salonId,
    user_id: null,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phonePrefix: row.phonePrefix,
    phoneNumber: row.phoneNumber,
    gender: row.gender,
    birthDate: row.birthDate,
    isTourist: row.isTourist ?? false,
    note: row.note,
  }),
  previewColumns: [
    { key: 'firstName', label: 'Nome' },
    { key: 'lastName', label: 'Cognome' },
    { key: 'email', label: 'Email' },
    { key: 'phonePrefix', label: 'Prefisso' },
    { key: 'phoneNumber', label: 'Telefono' },
    { key: 'gender', label: 'Sesso' },
    { key: 'birthDate', label: 'Nascita' },
    { key: 'note', label: 'Note' },
  ],
  redirectAfterCompletion: '/admin/clienti',
};
