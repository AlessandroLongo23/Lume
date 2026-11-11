'use client';

import { forwardRef, type ButtonHTMLAttributes, type ComponentType, type SVGProps } from 'react';
import { cn } from '@/lib/utils';
import { Slot } from './Slot';
import { Tooltip } from './Tooltip';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'ghost-destructive' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: IconComponent;
  trailingIcon?: IconComponent;
  iconOnly?: boolean;
  loading?: boolean;
  asChild?: boolean;
  /** Toggle buttons (an active filter, a view switch): the shared `selected` look + aria-pressed. */
  pressed?: boolean;
  /**
   * Icon-only buttons show their `aria-label` as a tooltip. Pass a string to
   * show a different text, or `false` when a wrapper already supplies one.
   */
  tooltip?: string | false;
  children?: React.ReactNode;
}

// md grows to 44px on touch screens, like the `control-md` recipe. The svg
// rule sizes icons passed as children (an `asChild` link's icon, icon-only
// buttons); `leadingIcon`/`trailingIcon` get the same size explicitly.
const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-[var(--lume-control-h-sm)] gap-[var(--lume-control-gap-sm)] text-[length:var(--lume-control-text-sm)] [&>svg]:size-3.5',
  md: 'h-[var(--lume-control-h-md)] pointer-coarse:h-[var(--lume-control-h-lg)] gap-[var(--lume-control-gap-md)] text-[length:var(--lume-control-text-md)] [&>svg]:size-4',
  lg: 'h-[var(--lume-control-h-lg)] gap-[var(--lume-control-gap-lg)] text-[length:var(--lume-control-text-lg)] [&>svg]:size-5',
};

const sizePaddingClasses: Record<ButtonSize, string> = {
  sm: 'px-[var(--lume-control-px-sm)]',
  md: 'px-[var(--lume-control-px-md)]',
  lg: 'px-[var(--lume-control-px-lg)]',
};

const iconOnlyClasses: Record<ButtonSize, string> = {
  // Small icon buttons sit in dense rows; on touch they still get a 44px target.
  sm: 'w-[var(--lume-control-h-sm)] pointer-coarse:size-[var(--lume-control-h-lg)] p-0',
  md: 'w-[var(--lume-control-h-md)] pointer-coarse:size-[var(--lume-control-h-lg)] p-0',
  lg: 'w-[var(--lume-control-h-lg)] p-0',
};

// Edges are 1px shadow rings (--lume-edge), never borders, so every size keeps
// its exact height. No hover lift or glow: hover changes the fill, press scales
// the whole control down a hair.
const variantClasses: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-[var(--lume-button-accent-bg)] text-[var(--lume-button-accent-fg)]',
    'hover:bg-primary-hover active:bg-primary-active',
  ),
  secondary: cn(
    'bg-[var(--lume-button-secondary-bg)] text-[var(--lume-button-secondary-fg)]',
    'shadow-[inset_0_0_0_1px_var(--lume-edge)]',
    'hover:bg-[var(--lume-button-secondary-bg-hover)]',
  ),
  ghost: cn(
    'bg-transparent text-[var(--lume-text-secondary)]',
    'hover:bg-hover hover:text-[var(--lume-text)]',
    'active:bg-active',
  ),
  // Reads as ghost at rest; red only on hover. For the buttons that open a
  // delete confirmation (and trash icons in rows): the confirmation itself
  // carries the solid `destructive` button.
  'ghost-destructive': cn(
    'bg-transparent text-[var(--lume-text-secondary)]',
    'hover:bg-danger-soft hover:text-danger-strong',
  ),
  // Solid red: only the button that performs a deletion, inside its confirmation.
  destructive: cn(
    'bg-[var(--lume-button-destructive-bg)] text-[var(--lume-button-destructive-fg)]',
    'hover:bg-[var(--lume-button-destructive-bg-hover)]',
  ),
};

const iconSize: Record<ButtonSize, string> = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    leadingIcon: LeadingIcon,
    trailingIcon: TrailingIcon,
    iconOnly = false,
    loading = false,
    asChild = false,
    pressed,
    tooltip,
    className,
    disabled,
    children,
    type,
    'aria-label': ariaLabel,
    ...rest
  },
  ref,
) {
  if (process.env.NODE_ENV !== 'production' && iconOnly && !ariaLabel) {
    console.warn('<Button iconOnly> requires an aria-label for accessibility.');
  }

  const isDisabled = disabled || loading;

  const classes = cn(
    // shrink-0: an icon-only button would otherwise squeeze below its width in a
    // tight flex row. A button that must shrink passes `shrink` (with min-w-0).
    'relative inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap [&>svg]:shrink-0',
    'transition-[background-color,color,scale,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out)]',
    // Press: shrink a hair. Touch devices get it too; it is the only press cue.
    'active:scale-[0.98] motion-reduce:active:scale-100',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lume-ring-focus)]',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
    sizeClasses[size],
    iconOnly ? iconOnlyClasses[size] : sizePaddingClasses[size],
    variantClasses[variant],
    // Icon-only ghost buttons (row actions, close, pagination) rest muted so a
    // column of icons stays quiet; labelled ghost keeps the secondary text.
    iconOnly && (variant === 'ghost' || variant === 'ghost-destructive') && 'text-[var(--lume-text-muted)]',
    // Wins over the variant's fill: the same chosen look as tabs and rows.
    pressed && 'bg-active! text-[var(--lume-text)]!',
    className,
  );

  const iconClass = iconSize[size];

  const content = loading ? (
    <>
      <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
        <span className={cn(iconClass, 'border-2 border-current border-t-transparent rounded-full animate-spin')} />
      </span>
      <span className="opacity-0 inline-flex items-center gap-[inherit]">
        {LeadingIcon && <LeadingIcon className={iconClass} aria-hidden />}
        {children}
        {TrailingIcon && <TrailingIcon className={iconClass} aria-hidden />}
      </span>
    </>
  ) : (
    <>
      {LeadingIcon && <LeadingIcon className={iconClass} aria-hidden />}
      {children}
      {TrailingIcon && <TrailingIcon className={iconClass} aria-hidden />}
    </>
  );

  const tip = iconOnly && tooltip !== false ? (tooltip ?? ariaLabel) : undefined;

  if (asChild) {
    return (
      <Tooltip label={tip}>
        <Slot className={classes} aria-label={ariaLabel} {...rest}>
          {children}
        </Slot>
      </Tooltip>
    );
  }

  return (
    <Tooltip label={tip}>
      <button
        ref={ref}
        type={type ?? 'button'}
        className={classes}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-pressed={pressed}
        aria-label={ariaLabel}
        {...rest}
      >
        {content}
      </button>
    </Tooltip>
  );
});
