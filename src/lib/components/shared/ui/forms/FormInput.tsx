'use client';

import { useId, useState, type InputHTMLAttributes } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function FormInput({ label, error, icon, className = '', type, ...props }: FormInputProps) {
  const hasError = !!error;
  const generatedId = useId();
  const id = props.id || generatedId;

  const isPassword = type === 'password';
  const [isVisible, setIsVisible] = useState(false);
  const inputType = isPassword ? (isVisible ? 'text' : 'password') : type;

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-foreground">
          {label}
          {props.required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}

        <input
          id={id}
          type={inputType}
          className={cn(
            'w-full px-3 py-2 rounded-md border bg-card text-foreground placeholder:text-muted-foreground',
            'transition-[border-color,box-shadow] duration-200 ease-[var(--ease-in-out)]',
            'focus:outline-none focus:ring-2 focus:ring-ring/20',
            icon && 'pl-10',
            isPassword && 'pr-10',
            hasError
              ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
              : 'border-input focus:border-ring',
            props.disabled && 'opacity-50 cursor-not-allowed bg-muted',
            className,
          )}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? `${id}-error` : undefined}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setIsVisible((v) => !v)}
            tabIndex={-1}
            aria-label={isVisible ? 'Nascondi password' : 'Mostra password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
          >
            {isVisible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </button>
        )}
      </div>

      {hasError && (
        <div id={`${id}-error`} className="flex items-center gap-2 text-destructive text-sm" role="alert">
          <AlertCircle className="size-4 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
