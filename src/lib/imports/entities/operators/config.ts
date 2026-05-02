import { parsePhone, splitFullName, titleCase } from '../../core/transforms';
import type { ColumnMapping, EntityImportConfig, RowResult } from '../types';

type DestField = 'firstName' | 'lastName' | 'fullName' | 'email' | 'phoneRaw' | 'phonePrefix' | 'phoneNumber';

interface OperatorRow extends Record<string, unknown> {
  firstName: string;
  lastName: string;
  email: string | null;
  phonePrefix: string | null;
  phoneNumber: string | null;
}

const DICTIONARY = {
  firstName:   ['nome', 'firstname', 'first name', 'first_name', 'name'],
  lastName:    ['cognome', 'lastname', 'last name', 'last_name', 'surname'],
  fullName:    ['nome completo', 'nominativo', 'operatore', 'full name', 'fullname'],
  email:       ['email', 'e-mail', 'mail', 'indirizzo email'],
  phoneRaw:    ['telefono', 'cellulare', 'numero', 'numero di telefono', 'cell', 'phone', 'mobile', 'tel'],
  phonePrefix: ['prefisso', 'prefix', 'country code', 'phone prefix'],
  phoneNumber: ['numero telefono', 'phone number', 'numero cellulare'],
};

function transformRow(
  source: Record<string, string>,
  mappings: ColumnMapping[],
  rowIndex: number,
): RowResult<OperatorRow> {
  const dest: Partial<Record<DestField, string>> = {};
  for (const m of mappings) {
    if (!m.destField || m.confidence < 0.6) continue;
    const value = source[m.sourceColumn];
    if (value == null || value === '') continue;
    dest[m.destField as DestField] = value;
  }

  let firstName = dest.firstName ? titleCase(dest.firstName) : null;
  let lastName = dest.lastName ? titleCase(dest.lastName) : null;
  if ((!firstName || !lastName) && dest.fullName) {
    const split = splitFullName(dest.fullName);
    firstName ??= split.firstName ? titleCase(split.firstName) : null;
    lastName ??= split.lastName ? titleCase(split.lastName) : null;
  }

  let phonePrefix: string | null = null;
  let phoneNumber: string | null = null;
  if (dest.phoneRaw) {
    const parsed = parsePhone(dest.phoneRaw);
    phonePrefix = parsed.phonePrefix;
    phoneNumber = parsed.phoneNumber;
  } else if (dest.phonePrefix || dest.phoneNumber) {
    const combined = `${dest.phonePrefix ?? ''} ${dest.phoneNumber ?? ''}`.trim();
    const parsed = parsePhone(combined || (dest.phoneNumber ?? null));
    phonePrefix = parsed.phonePrefix ?? (dest.phonePrefix?.trim() || null);
    phoneNumber = parsed.phoneNumber ?? (dest.phoneNumber?.trim() || null);
  }

  const email = dest.email ? dest.email.trim().toLowerCase() : null;

  const candidate: OperatorRow = {
    firstName: firstName ?? '',
    lastName: lastName ?? '',
    email,
    phonePrefix,
    phoneNumber,
  };

  const reasons: string[] = [];
  if (!candidate.firstName) reasons.push('nome mancante');
  if (!candidate.lastName) reasons.push('cognome mancante');
  if (dest.email && !candidate.email) reasons.push('email non valida');
  if (candidate.email && !/.+@.+\..+/.test(candidate.email)) reasons.push('email non valida');

  if (reasons.length > 0) {
    return { ok: false, rowIndex, reason: reasons.join(', '), rawValues: source, partialRow: candidate };
  }
  return { ok: true, row: candidate };
}

export const operatorsConfig: EntityImportConfig<OperatorRow> = {
  entity: 'operators',
  table: 'operators',
  italianLabel: 'Operatori',
  destFields: Object.keys(DICTIONARY),
  destFieldLabels: {
    firstName: 'Nome',
    lastName: 'Cognome',
    fullName: 'Nome completo (verrà diviso)',
    email: 'Email',
    phoneRaw: 'Telefono (combinato)',
    phonePrefix: 'Prefisso telefonico',
    phoneNumber: 'Numero (senza prefisso)',
  },
  hasRequiredCoverage: (mappings) => {
    const mapped = new Set(mappings.filter((m) => m.confidence >= 0.6).map((m) => m.destField as DestField));
    if (mapped.has('firstName') && mapped.has('lastName')) return true;
    return mapped.has('fullName');
  },
  insufficientMappingReason: 'Impossibile identificare nome e cognome dell\'operatore con sufficiente certezza.',
  dictionary: DICTIONARY,
  llmFieldDescriptions: {
    firstName: "operator's first name",
    lastName: "operator's last name",
    fullName: 'combined name (will be split)',
    email: 'operator email',
    phoneRaw: 'phone number (combined prefix + number)',
    phonePrefix: 'international dialing code only',
    phoneNumber: 'phone digits without prefix',
  },
  llmDomainHint: 'salon staff (operators / hairdressers / barbers / employees)',
  transformRow,
  dedupKeys: [
    { rowField: 'email', column: 'email', normalize: 'lower' },
    { rowField: 'phoneNumber', column: 'phoneNumber' },
  ],
  buildInsertPayload: (row, { salonId }) => ({
    salon_id: salonId,
    user_id: null,
    must_change_password: false,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phonePrefix: row.phonePrefix,
    phoneNumber: row.phoneNumber,
  }),
  previewColumns: [
    { key: 'firstName', label: 'Nome' },
    { key: 'lastName', label: 'Cognome' },
    { key: 'email', label: 'Email' },
    { key: 'phonePrefix', label: 'Prefisso' },
    { key: 'phoneNumber', label: 'Telefono' },
  ],
  redirectAfterCompletion: '/admin/operatori',
};
