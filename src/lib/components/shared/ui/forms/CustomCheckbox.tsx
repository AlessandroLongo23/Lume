'use client';

import { Check } from 'lucide-react';

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomCheckbox({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}: CustomCheckboxProps) {
  const toggle = () => { if (!disabled) onChange(!checked); };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          onClick={toggle}
          className={`${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} select-none text-sm`}
        >
          {label}
        </label>
      )}
      <div
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        tabIndex={disabled ? -1 : 0}
        onClick={toggle}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } }}
        className={`h-10 w-10 flex items-center justify-center rounded-lg border transition-all duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50
          ${checked
            ? 'border-indigo-500/50 bg-indigo-500/10'
            : 'border-zinc-500/25 bg-white dark:bg-zinc-800'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-500/30'}
          ${className}`}
      >
        {checked && <Check className="size-4 text-indigo-500" strokeWidth={2} />}
      </div>
    </div>
  );
}
