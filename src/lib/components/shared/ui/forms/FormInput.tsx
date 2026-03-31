'use client';

import { useId, type InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function FormInput({ label, error, icon, className = '', ...props }: FormInputProps) {
  const hasError = !!error;
  const hasValue = !!props.value;
  const generatedId = useId();
  const id = props.id || generatedId;

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm font-thin text-zinc-700 dark:text-zinc-200 mb-2">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            {icon}
          </div>
        )}

        <input
          id={id}
          className={`w-full px-4 py-3 ${icon ? 'pl-12' : ''} rounded-xl border-2 transition-all duration-300
            bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100
            placeholder-zinc-500 dark:placeholder-zinc-500 focus:outline-none
            ${hasError
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : hasValue
                ? 'border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                : 'border-zinc-500/25 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-zinc-300 dark:hover:border-zinc-600'
            }
            ${props.disabled ? 'opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-800' : ''}
            ${className}`}
          {...props}
        />
      </div>

      {hasError && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
