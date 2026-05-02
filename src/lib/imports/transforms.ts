import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Splits a free-form phone string into our (phonePrefix, phoneNumber) shape.
 * Defaults to IT region when no country code is present. Returns nulls if the
 * input doesn't parse to a possible number — caller decides whether to fail
 * the row or stash the raw string in `note`.
 */
export function parsePhone(raw: string | null | undefined): { phonePrefix: string | null; phoneNumber: string | null } {
  if (!raw) return { phonePrefix: null, phoneNumber: null };
  const trimmed = String(raw).trim();
  if (!trimmed) return { phonePrefix: null, phoneNumber: null };

  const parsed = parsePhoneNumberFromString(trimmed, 'IT');
  if (!parsed || !parsed.isPossible()) return { phonePrefix: null, phoneNumber: null };

  return {
    phonePrefix: `+${parsed.countryCallingCode}`,
    phoneNumber: parsed.nationalNumber,
  };
}

/**
 * Parses a free-form date string in the formats Italian salons typically use:
 * DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, D/M/YY, with or without time tail.
 * Returns ISO date string YYYY-MM-DD, or null if unparseable / ambiguous.
 *
 * Italian convention is DD/MM by default; we never silently flip to MM/DD.
 */
export function parseItalianDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  // ISO YYYY-MM-DD (or YYYY/MM/DD): unambiguous
  const iso = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso;
    return formatYmd(Number(y), Number(m), Number(d));
  }

  // DD/MM/YYYY or DD-MM-YYYY (Italian default)
  const dmy = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (dmy) {
    const [, dStr, mStr, yStr] = dmy;
    const d = Number(dStr);
    const m = Number(mStr);
    let y = Number(yStr);
    if (yStr.length === 2) {
      // Two-digit year heuristic: 00-30 → 2000s, 31-99 → 1900s
      // (a 6-year-old or a 95-year-old are both plausible salon clients)
      y = y <= 30 ? 2000 + y : 1900 + y;
    }
    return formatYmd(y, m, d);
  }

  return null;
}

function formatYmd(y: number, m: number, d: number): string | null {
  if (!isValidDate(y, m, d)) return null;
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

function isValidDate(y: number, m: number, d: number): boolean {
  if (y < 1900 || y > new Date().getFullYear()) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  // Bounce through Date for actual day-in-month validation
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

/**
 * Splits a "Mario Rossi" or "Rossi Mario" full name into first/last. The
 * heuristic is naive (first token = firstName) but matches how Italian salon
 * exports typically list names. Returns nulls if the input is empty.
 */
export function splitFullName(raw: string | null | undefined): { firstName: string | null; lastName: string | null } {
  if (!raw) return { firstName: null, lastName: null };
  const trimmed = String(raw).trim().replace(/\s+/g, ' ');
  if (!trimmed) return { firstName: null, lastName: null };
  const parts = trimmed.split(' ');
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/**
 * Normalizes a gender value to 'M' | 'F' | null. Accepts Italian and English
 * spellings, single letters, and honorifics. Anything else returns null
 * (don't guess — let the row pass with no gender rather than mislabel).
 */
export function parseGender(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = String(raw).trim().toLowerCase();
  if (!v) return null;
  if (['m', 'maschio', 'maschile', 'male', 'man', 'uomo', 'sig.', 'sig', 'signor', 'signore', 'mr', 'mr.'].includes(v)) return 'M';
  if (['f', 'femmina', 'femminile', 'female', 'woman', 'donna', 'sig.ra', 'sigra', 'sig.ra.', 'signora', 'mrs', 'mrs.', 'ms', 'ms.'].includes(v)) return 'F';
  return null;
}

/**
 * Parses booleans from common text representations (Italian + English).
 */
export function parseBool(raw: string | null | undefined): boolean | null {
  if (raw == null) return null;
  if (typeof raw === 'boolean') return raw;
  const v = String(raw).trim().toLowerCase();
  if (!v) return null;
  if (['true', 'sì', 'si', 'yes', 'y', 's', '1', 'x'].includes(v)) return true;
  if (['false', 'no', 'n', '0'].includes(v)) return false;
  return null;
}

/**
 * Capitalizes the first letter of each whitespace-separated token, leaving the
 * rest of each token lowercase. Useful for names imported in ALL CAPS.
 */
export function titleCase(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return String(raw)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .join(' ');
}
