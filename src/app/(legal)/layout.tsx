import Link from 'next/link';
import type { ReactNode } from 'react';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" aria-label="Torna alla home">
            <LumeLogo size="sm" />
          </Link>
          <Link
            href="/"
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            ← Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <article className="prose prose-zinc dark:prose-invert prose-sm md:prose-base max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-li:text-muted-foreground prose-table:text-foreground">
          {children}
        </article>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-4 text-xs text-muted-foreground">
          <p>© 2026 Lume</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/cookie-policy" className="hover:text-foreground">
              Cookie policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
