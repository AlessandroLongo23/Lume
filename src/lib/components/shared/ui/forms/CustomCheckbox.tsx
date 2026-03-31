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
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') toggle(); }}
        className={`size-6 flex items-center justify-center rounded border transition-all duration-200
          border-gray-300 dark:border-gray-600
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}`}
      >
        {checked && <Check className="size-4 text-black dark:text-white" strokeWidth={1.5} />}
      </div>
    </div>
  );
}
