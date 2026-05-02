import { z } from 'zod';
import { parsePhone, parseItalianDate, splitFullName, parseGender, parseBool, titleCase } from './transforms';
import type { ColumnMapping } from './llmMapper';
import type { ClientDestField } from './clientHeaderDictionary';

/** Shape of a single client row ready to insert into public.clients. */
export const clientInsertSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().nullable(),
  phonePrefix: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  gender: z.string().nullable(),
  birthDate: z.string().nullable(), // ISO YYYY-MM-DD
  isTourist: z.boolean().nullable(),
  note: z.string().nullable(),
});

export type ClientInsertRow = z.infer<typeof clientInsertSchema>;

export interface TransformedRow {
  ok: true;
  row: ClientInsertRow;
}

export interface FailedRow {
  ok: false;
  rowIndex: number;
  reason: string;
  rawValues: Record<string, string>;
}

export type RowResult = TransformedRow | FailedRow;

/**
 * Applies the column map to a single source row and returns a validated client
 * insert payload (or a structured error). Never throws — caller iterates over
 * thousands of rows and needs deterministic per-row outcomes.
 */
export function transformRow(
  source: Record<string, string>,
  mappings: ColumnMapping[],
  rowIndex: number,
): RowResult {
  // Build a partial destination object by walking the column map
  const dest: Partial<Record<ClientDestField, string>> = {};
  for (const m of mappings) {
    if (!m.destField || m.confidence < 0.6) continue;
    const value = source[m.sourceColumn];
    if (value == null || value === '') continue;
    dest[m.destField] = value;
  }

  // Resolve first/last name — either directly mapped, or via fullName split
  let firstName = dest.firstName ? titleCase(dest.firstName) : null;
  let lastName = dest.lastName ? titleCase(dest.lastName) : null;
  if ((!firstName || !lastName) && dest.fullName) {
    const split = splitFullName(dest.fullName);
    firstName ??= split.firstName ? titleCase(split.firstName) : null;
    lastName ??= split.lastName ? titleCase(split.lastName) : null;
  }

  // Phone: either combined phoneRaw or split prefix+number
  let phonePrefix: string | null = null;
  let phoneNumber: string | null = null;
  if (dest.phoneRaw) {
    const parsed = parsePhone(dest.phoneRaw);
    phonePrefix = parsed.phonePrefix;
    phoneNumber = parsed.phoneNumber;
  } else if (dest.phonePrefix || dest.phoneNumber) {
    // Try to parse the combination if both present
    const combined = `${dest.phonePrefix ?? ''} ${dest.phoneNumber ?? ''}`.trim();
    const parsed = parsePhone(combined || (dest.phoneNumber ?? null));
    phonePrefix = parsed.phonePrefix ?? (dest.phonePrefix?.trim() || null);
    phoneNumber = parsed.phoneNumber ?? (dest.phoneNumber?.trim() || null);
  }

  const email = dest.email ? dest.email.trim().toLowerCase() : null;
  const gender = parseGender(dest.gender);
  const birthDate = parseItalianDate(dest.birthDate);
  const isTourist = parseBool(dest.isTourist);
  const note = dest.note ? dest.note.trim() : null;

  const candidate: ClientInsertRow = {
    firstName: firstName ?? '',
    lastName: lastName ?? '',
    email,
    phonePrefix,
    phoneNumber,
    gender,
    birthDate,
    isTourist,
    note,
  };

  // Surface row-level reasons for failure so the user can fix and re-import
  const reasons: string[] = [];
  if (!candidate.firstName) reasons.push('nome mancante');
  if (!candidate.lastName) reasons.push('cognome mancante');
  if (dest.email && !candidate.email) reasons.push('email non valida');
  if (dest.email && candidate.email && !/.+@.+\..+/.test(candidate.email)) reasons.push('email non valida');
  if (dest.birthDate && !candidate.birthDate) reasons.push('data di nascita non valida');
  if (dest.phoneRaw && !candidate.phoneNumber) {
    // Phone failed to parse — keep raw in note instead of failing the row
    candidate.note = candidate.note ? `${candidate.note}\n[telefono non valido: ${dest.phoneRaw}]` : `[telefono non valido: ${dest.phoneRaw}]`;
  }

  if (reasons.length > 0) {
    return { ok: false, rowIndex, reason: reasons.join(', '), rawValues: source };
  }

  const parsed = clientInsertSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      ok: false,
      rowIndex,
      reason: parsed.error.issues.map((i) => i.message).join(', '),
      rawValues: source,
    };
  }

  return { ok: true, row: parsed.data };
}
