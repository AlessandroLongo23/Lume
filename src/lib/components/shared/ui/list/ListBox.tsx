'use client';

import {
  createContext,
  forwardRef,
  useContext,
  useRef,
  type ButtonHTMLAttributes,
  type ComponentType,
  type HTMLAttributes,
  type ReactNode,
  type SVGProps,
} from 'react';
import { Check } from 'lucide-react';
import { useHoverGlide } from '@/lib/hooks/useHoverGlide';
import { cn } from '@/lib/utils';
import { Slot } from '../Slot';

/**
 * The one list of rows in Lume: menus, select options, pickers, autocomplete
 * suggestions, popover lists. It owns the hover glide (pointer, keyboard
 * focus and `data-highlighted` for arrow keys), so every list moves the same
 * way and nobody wires the glide by hand. Rows are <ListRow>.
 *
 * It mounts with the list, so it works inside portals and popovers that
 * appear later. Positioning and the floating surface are the caller's (see
 * <FloatingPanel>); a ListBox can also sit inline.
 */

type ListRole = 'listbox' | 'menu' | 'list';

const ListRoleContext = createContext<{ role: ListRole; multiple: boolean }>({ role: 'list', multiple: false });

interface ListBoxProps extends HTMLAttributes<HTMLDivElement> {
  role?: ListRole;
  /** Several rows can be chosen: rows show a check, not a fill. */
  multiple?: boolean;
}

export const ListBox = forwardRef<HTMLDivElement, ListBoxProps>(function ListBox(
  { role = 'list', multiple = false, className, children, ...rest },
  forwardedRef,
) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useHoverGlide(innerRef, '[data-list-row]', { followAttribute: 'data-highlighted' });

  const setRef = (node: HTMLDivElement | null) => {
    innerRef.current = node;
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  return (
    <ListRoleContext.Provider value={{ role, multiple }}>
      <div
        ref={setRef}
        role={role === 'list' ? undefined : role}
        aria-multiselectable={multiple && role === 'listbox' ? true : undefined}
        className={cn('relative flex flex-col gap-px p-1', className)} {...rest}>
        <span ref={glowRef} className="hover-glide" aria-hidden />
        {children}
      </div>
    </ListRoleContext.Provider>
  );
});

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

interface ListRowProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The chosen option(s). Renders the shared "selected" look. */
  selected?: boolean;
  /** The keyboard-active row (arrow keys); the glide follows it. */
  highlighted?: boolean;
  /** Show a check mark when selected (multi-select lists). */
  check?: boolean;
  icon?: IconComponent;
  /** Content at the end of the row: a count, a shortcut, a chevron. */
  trailing?: ReactNode;
  /** Secondary line under the label. */
  description?: ReactNode;
  destructive?: boolean;
  /** Render the child element (a Link) with the row's props and classes. */
  asChild?: boolean;
}

export const ListRow = forwardRef<HTMLButtonElement, ListRowProps>(function ListRow(
  { selected, highlighted, check, icon: Icon, trailing, description, destructive, asChild, className, children, type, ...rest },
  ref,
) {
  const { role: listRole, multiple } = useContext(ListRoleContext);
  // Plain lists keep native button semantics: no list/listitem roles.
  const rowRole =
    listRole === 'listbox' ? 'option' : listRole === 'menu' ? (multiple ? 'menuitemcheckbox' : 'menuitem') : undefined;

  const shared = {
    'data-list-row': '',
    'data-highlighted': highlighted ? '' : undefined,
    role: rowRole,
    'aria-selected': rowRole === 'option' ? !!selected : undefined,
    'data-selected': selected && rowRole !== 'option' && !multiple ? '' : undefined,
    'data-multi': multiple ? '' : undefined,
    'aria-checked': rowRole === 'menuitemcheckbox' ? !!selected : undefined,
    'aria-pressed': multiple && !rowRole ? !!selected : undefined,
    className: cn('list-row group/row', destructive && 'list-row-danger', className),
    ...rest,
  };

  if (asChild) return <Slot {...shared}>{children}</Slot>;

  return (
    <button ref={ref} type={type ?? 'button'} {...shared}>
      {Icon && (
        <Icon
          aria-hidden
          className={cn(
            'size-4 shrink-0 transition-colors duration-[var(--duration-fast)]',
            destructive ? '' : 'text-[var(--lume-text-muted)] group-hover/row:text-[var(--lume-text)] group-data-[highlighted]/row:text-[var(--lume-text)]',
          )}
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{children}</span>
        {description && (
          <span className="block truncate text-xs font-normal text-[var(--lume-text-muted)]">{description}</span>
        )}
      </span>
      {trailing}
      {(check || multiple) && (
        <Check aria-hidden className={cn('size-4 shrink-0 text-[var(--lume-text)] transition-opacity duration-[var(--duration-fast)]', selected ? 'opacity-100' : 'opacity-0')} />
      )}
    </button>
  );
});

/** A small muted heading above a group of rows. */
export function ListGroupLabel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div role="presentation" className={cn('px-3 pt-2 pb-1 text-xs text-[var(--lume-text-muted)]', className)}>
      {children}
    </div>
  );
}

/** A hairline between groups of rows. */
export function ListSeparator({ className }: { className?: string }) {
  return <div role="separator" className={cn('my-1 mx-2 h-px bg-line', className)} />;
}

/** The one-line message shown when a list has nothing to show. */
export function ListEmpty({ children }: { children: ReactNode }) {
  return <div className="px-3 py-3 text-sm text-center text-[var(--lume-text-muted)]">{children}</div>;
}
