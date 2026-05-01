'use client';

import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FormButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const sizeClasses: Record<NonNullable<FormButtonProps['size']>, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

const variantClasses: Record<NonNullable<FormButtonProps['variant']>, string> = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active hover:-translate-y-px hover:shadow-[0_8px_24px_-8px_var(--lume-accent-muted)]',
  secondary:
    'bg-secondary text-secondary-foreground border border-border hover:bg-muted hover:-translate-y-px',
  outline:
    'bg-transparent text-primary border border-primary hover:bg-[var(--lume-accent-light)]',
  ghost:
    'bg-transparent text-foreground hover:bg-muted',
};

export function FormButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: FormButtonProps) {
  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center gap-2 font-medium rounded-md',
        'transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-[var(--ease-in-out)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        'max-md:active:translate-y-0',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </span>
          <span className="opacity-0">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
