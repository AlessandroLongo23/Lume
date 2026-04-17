const DEFAULT_PREFIX = '+39';

function stripNonDigits(input: string): string {
  return input.replace(/[^0-9]/g, '');
}

export function toE164(prefix: string | null | undefined, number: string | null | undefined): string | null {
  if (!prefix || !number) return null;
  const digits = stripNonDigits(number);
  const prefixDigits = stripNonDigits(prefix);
  if (!digits || !prefixDigits) return null;
  return `+${prefixDigits}${digits}`;
}

export function normalizeLoginPhone(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('+')) {
    const digits = stripNonDigits(trimmed);
    return digits ? `+${digits}` : null;
  }
  const digits = stripNonDigits(trimmed);
  if (!digits) return null;
  return `${DEFAULT_PREFIX}${digits}`;
}

export function isEmailLike(value: string): boolean {
  return value.includes('@');
}
