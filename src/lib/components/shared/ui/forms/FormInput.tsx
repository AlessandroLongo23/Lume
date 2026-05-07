'use client';

import { useId, useState, type InputHTMLAttributes } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type ControlSize = 'sm' | 'md' | 'lg';

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  size?: ControlSize;
}

const sizeClasses: Record<ControlSize, string> = {
  sm: 'h-[var(--lume-control-h-sm)] px-[var(--lume-control-px-sm)] text-[length:var(--lume-control-text-sm)]',
  md: 'h-[var(--lume-control-h-md)] px-[var(--lume-control-px-md)] text-[length:var(--lume-control-text-md)]',
  lg: 'h-[var(--lume-control-h-lg)] px-[var(--lume-control-px-lg)] text-[length:var(--lume-control-text-lg)]',
};

const iconPaddingClasses: Record<ControlSize, string> = {
  sm: 'pl-8',
  md: 'pl-9',
  lg: 'pl-11',
};

const iconLeftClasses: Record<ControlSize, string> = {
  sm: 'left-2',
  md: 'left-3',
  lg: 'left-3.5',
};

export function FormInput({
  label,
  error,
  icon,
  size: inputSize = 'md',
  className = '',
  type,
  ...props
}: FormInputProps) {
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
          <div className={cn('absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none', iconLeftClasses[inputSize])}>
            {icon}
          </div>
        )}

        <input
          id={id}
          type={inputType}
          className={cn(
            'w-full rounded-md border bg-card text-foreground placeholder:text-muted-foreground',
            'transition-[border-color,box-shadow] duration-200 ease-[var(--ease-in-out)]',
            'focus:outline-none focus:ring-2 focus:ring-ring/20',
            sizeClasses[inputSize],
            icon && iconPaddingClasses[inputSize],
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
