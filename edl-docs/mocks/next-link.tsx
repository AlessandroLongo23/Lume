// next/link in the docs canvas: a plain anchor that does not navigate the
// preview frame away from the story.
import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react';

type Href = string | { pathname?: string; query?: Record<string, string> };

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: Href;
  children?: ReactNode;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
}

const toHref = (href: Href) =>
  typeof href === 'string' ? href : `${href.pathname ?? ''}${href.query ? `?${new URLSearchParams(href.query)}` : ''}`;

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, prefetch: _prefetch, replace: _replace, scroll: _scroll, onClick, ...rest },
  ref,
) {
  return (
    <a
      ref={ref}
      href={toHref(href)}
      onClick={(e) => {
        onClick?.(e);
        e.preventDefault();
      }}
      {...rest}
    />
  );
});

export default Link;
