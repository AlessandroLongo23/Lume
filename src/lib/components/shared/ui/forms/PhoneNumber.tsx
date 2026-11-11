'use client';

import { useRef } from 'react';
import { prefixes } from '@/lib/const/prefixes';
import { cn } from '@/lib/utils';
import { Select } from './Select';

interface PhoneNumberProps {
  prefixCode: string;
  phoneNumber: string;
  onPrefixChange: (code: string) => void;
  onPhoneChange: (number: string) => void;
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
  /** Control height: md (36px, 44px on touch) or lg (44px everywhere, e.g. the booking page). */
  size?: 'md' | 'lg';
}

// Countries sorted once; the prefix list is static.
const sortedPrefixes = [...prefixes].sort((a, b) => a.country.localeCompare(b.country));

/** Just the country prefix picker (searchable by country), for forms that store it apart. */
export function PhonePrefixSelect({
  value,
  onChange,
  disabled,
  className = 'w-auto shrink-0',
  id,
  invalid,
  size = 'md',
}: {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  /** Wrapper classes; sized to its content by default. */
  className?: string;
  /** Wired by <Field> so its label names the picker. */
  id?: string;
  invalid?: boolean;
  size?: 'md' | 'lg';
}) {
  return (
    <Select
      value={value}
      onChange={onChange}
      options={sortedPrefixes}
      // Country names repeat across prefixes (+1 is shared), so the value stays
      // the prefix code; search runs on the country.
      valueKey="code"
      labelKey="country"
      searchPlaceholder="Cerca paese…"
      ariaLabel={id ? undefined : 'Prefisso telefonico'}
      id={id}
      invalid={invalid}
      className={className}
      size={size}
      panelWidth={240}
      disabled={disabled}
      renderValue={(p) => <span className="tabular-nums">{p.code}</span>}
      renderOption={(p) => (
        <span className="flex items-baseline gap-2.5">
          <span className="tabular-nums text-[var(--lume-text)] w-10 shrink-0">{p.code}</span>
          <span className="truncate">{p.country}</span>
        </span>
      )}
    />
  );
}

/** Country prefix (a searchable <Select>) beside the number, both on the field surface. */
export function PhoneNumber({
  prefixCode,
  phoneNumber,
  onPrefixChange,
  onPhoneChange,
  disabled = false,
  id,
  invalid,
  size = 'md',
}: PhoneNumberProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedPrefix = prefixes.find((p) => p.code === prefixCode) ?? prefixes[0];

  const formatNumber = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    const matches = cleaned.match(selectedPrefix.format);
    if (!matches) return cleaned;
    return matches.slice(1).filter(Boolean).join(' ');
  };

  return (
    <div className="flex flex-row gap-2">
      <PhonePrefixSelect
        value={prefixCode}
        onChange={(code) => { onPrefixChange(code); inputRef.current?.focus(); }}
        disabled={disabled}
        size={size}
      />
      <input
        ref={inputRef}
        id={id}
        type="tel"
        inputMode="tel"
        placeholder={selectedPrefix.placeholder || '000 000 0000'}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn('control flex-1 min-w-0', size === 'lg' ? 'control-lg' : 'control-md')}
        value={phoneNumber}
        onChange={(e) => onPhoneChange(formatNumber(e.target.value))}
      />
    </div>
  );
}
