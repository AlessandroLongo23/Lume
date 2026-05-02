/**
 * Generic value-coercion helpers shared by every entity's transformRow.
 * Domain-specific helpers (e.g. gender → M/F) live in the entity's own folder.
 */

/**
 * Splits a free-form phone string into our (phonePrefix, phoneNumber) shape.
 * Defaults to IT (+39) when no country code is present.
 *
 * Heuristic (intentionally simple — Italian salon imports only):
 *  • If input starts with `+`, take the country dial code (1-3 digits) as
 *    prefix and the rest as national number.
 *  • If input starts with `00`, treat as international (00 + dial code + number).
 *  • Otherwise assume IT (+39). Italian mobiles start with 3 (10 digits),
 *    landlines start with 0 (8-12 digits incl. leading 0).
 *
 * Returns nulls if the digits don't satisfy basic length sanity (≥6, ≤15
 * per E.164). Caller decides whether to fail the row or stash the raw value.
 */
export function parsePhone(raw: string | null | undefined): { phonePrefix: string | null; phoneNumber: string | null } {
  if (!raw) return { phonePrefix: null, phoneNumber: null };
  const trimmed = String(raw).trim();
  if (!trimmed) return { phonePrefix: null, phoneNumber: null };

  // Reject obvious non-phone strings like "0/5", "N/A", "no", short codes
  const digitsOnly = trimmed.replace(/[^0-9]/g, '');
  if (digitsOnly.length < 6 || digitsOnly.length > 15) {
    return { phonePrefix: null, phoneNumber: null };
  }

  // Already in international format: +CC...
  if (trimmed.startsWith('+')) {
    const m = digitsOnly;
    // Country code 1-3 digits — prefer 3 if it matches a known IT-adjacent code
    for (const cc of ['39', '1', '44', '49', '33', '34', '41', '43', '45', '46', '47', '48', '40', '36', '385', '386', '387', '420']) {
      if (m.startsWith(cc) && m.length - cc.length >= 6) {
        return { phonePrefix: `+${cc}`, phoneNumber: m.slice(cc.length) };
      }
    }
    // Fallback: split as +<first 1-2 digits><rest> guessing 2-digit CC
    return { phonePrefix: `+${m.slice(0, 2)}`, phoneNumber: m.slice(2) };
  }

  // 00-prefixed international: 0039...
  if (digitsOnly.startsWith('00') && digitsOnly.length >= 10) {
    const rest = digitsOnly.slice(2);
    return { phonePrefix: `+${rest.slice(0, 2)}`, phoneNumber: rest.slice(2) };
  }

  // Default: Italian
  return { phonePrefix: '+39', phoneNumber: digitsOnly };
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

/**
 * Parses a number from a free-form string. Accepts both Italian (1.234,56) and
 * English (1,234.56) formats, plus currency symbols and common units. Returns
 * null on unparseable input.
 */
export function parseNumber(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  let s = String(raw).trim();
  if (!s) return null;
  // Strip currency / spaces / non-numeric clutter except separators and minus
  s = s.replace(/[^0-9,.\-]/g, '');
  if (!s) return null;
  // If both '.' and ',' are present, the LAST one is the decimal separator
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastDot >= 0 && lastComma >= 0) {
    if (lastComma > lastDot) {
      // Italian: '.' = thousands, ',' = decimal
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // English: ',' = thousands, '.' = decimal
      s = s.replace(/,/g, '');
    }
  } else if (lastComma >= 0) {
    // Single ',' — treat as decimal
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parses an integer from a free-form string. Returns null on unparseable input.
 */
export function parseInteger(raw: string | null | undefined): number | null {
  const n = parseNumber(raw);
  if (n == null) return null;
  return Math.trunc(n);
}

/**
 * Normalizes a name-like string for case-insensitive lookup. Lowercase + trim +
 * collapsed whitespace. Used by FK resolution and dedup-by-name.
 */
export function normalizeNameKey(raw: string | null | undefined): string {
  if (!raw) return '';
  return String(raw).trim().toLowerCase().replace(/\s+/g, ' ');
}
