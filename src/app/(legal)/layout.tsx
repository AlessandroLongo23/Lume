import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Termini' },
  { href: '/cookie-policy', label: 'Cookie policy' },
  { href: '/dpa', label: 'DPA' },
  { href: '/sub-processors', label: 'Sub-processors' },
];

// Prose is mapped onto the semantic tokens so both themes read the same way:
// headings full-strength, body secondary, hairline tables, links underlined.
const PROSE = [
  'prose prose-sm md:prose-base max-w-none',
  'prose-headings:font-medium prose-headings:tracking-tight prose-headings:text-[var(--lume-text)]',
  'prose-h1:text-3xl md:prose-h1:text-4xl prose-h1:leading-tight',
  'prose-p:text-[var(--lume-text-secondary)] prose-li:text-[var(--lume-text-secondary)]',
  'prose-strong:text-[var(--lume-text)] prose-strong:font-medium',
  'prose-a:text-[var(--lume-text)] prose-a:font-normal prose-a:underline-offset-4 prose-a:decoration-[var(--lume-edge-hover)] hover:prose-a:decoration-[var(--lume-text)]',
  'prose-table:text-[var(--lume-text)] prose-th:font-medium prose-th:text-[var(--lume-text)]',
  'prose-thead:border-line prose-tr:border-line prose-hr:border-line',
  'prose-code:text-[var(--lume-text)] prose-li:marker:text-[var(--lume-text-muted)]',
].join(' ');

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[var(--lume-bg)] text-[var(--lume-text)]">
      <header className="sticky top-0 z-header border-b border-line bg-[color-mix(in_oklab,var(--lume-bg)_90%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/" aria-label="Lume, pagina iniziale" className="rounded-md">
            <LumeLogo size="sm" />
          </Link>
          <Button variant="ghost" size="lg" asChild className="-mr-2 px-2 text-sm font-normal">
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden />
              Torna alla home
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <article className={PROSE}>{children}</article>
      </main>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 text-compact text-[var(--lume-text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Note legali" className="flex flex-wrap gap-x-5 gap-y-1">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="inline-flex items-center min-h-11 sm:min-h-8 text-[var(--lume-text-secondary)] hover:text-[var(--lume-text)] transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <p>© 2026 Lume</p>
        </div>
      </footer>
    </div>
  );
}
