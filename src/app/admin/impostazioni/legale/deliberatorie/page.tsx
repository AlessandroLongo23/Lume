'use client';

import Link from 'next/link';
import { FileText, ChevronRight } from 'lucide-react';
import { DELIBERATORIE } from '@/lib/legal/deliberatorie';
import { ListBox, ListRow } from '@/lib/components/shared/ui/list/ListBox';
import { StatusDot } from '@/lib/components/shared/ui/StatusDot';
import { TextLink } from '@/lib/components/shared/ui/TextLink';

export default function DeliberatoriePage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">Deliberatorie</h2>
        <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">
          Modulistica pre-compilata che il salone consegna ai propri clienti per essere
          conforme al GDPR e al Codice Privacy. Ogni modulo legge automaticamente i dati
          della tua attività dalle impostazioni.
        </p>
      </div>

      <div className="mb-6 flex gap-3 text-sm">
        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning-strong" aria-hidden />
        <div>
          <p className="font-medium text-[var(--lume-text)]">Consegna obbligatoria al primo appuntamento.</p>
          <p className="mt-0.5 text-[var(--lume-text-secondary)]">
            L&apos;informativa privacy va data a ogni nuovo cliente. I consensi sono richiesti
            solo se tratti i relativi dati (allergie, foto, marketing, …).
          </p>
        </div>
      </div>

      <div className="border-y border-line py-2">
      {/* Pulled out by the list's inner padding so row text lines up with the page. */}
      <ListBox className="-mx-4">
        {DELIBERATORIE.map((d) => (
          <ListRow key={d.slug} asChild className="items-start gap-3 py-3">
            <Link href={`/admin/impostazioni/legale/deliberatorie/${d.slug}`}>
              <FileText className="size-4 text-[var(--lume-text-muted)] mt-0.5 shrink-0" aria-hidden />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-x-2 gap-y-1 flex-wrap">
                  <p className="text-sm font-medium text-[var(--lume-text)]">{d.title}</p>
                  {d.required && (
                    <StatusDot tone="warning" className="text-xs text-[var(--lume-text-secondary)]">Obbligatoria</StatusDot>
                  )}
                  <span className="text-xs text-[var(--lume-text-muted)]">· {d.legalBasis}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">{d.description}</p>
              </div>
              <ChevronRight className="size-4 text-[var(--lume-text-muted)] mt-0.5 shrink-0 transition-transform duration-[var(--duration-fast)] group-hover/row:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
            </Link>
          </ListRow>
        ))}
      </ListBox>
      </div>

      <div className="mt-8 text-sm text-[var(--lume-text-secondary)]">
        <p className="font-medium text-[var(--lume-text)] mb-1">Hai bisogno del Registro dei Trattamenti?</p>
        <p>
          Il <TextLink href="/admin/impostazioni/legale/registro-trattamenti">Registro
          dei Trattamenti</TextLink> (Art. 30 GDPR) è obbligatorio per ogni titolare che tratta dati
          particolari. Lume lo genera automaticamente in base alle tue impostazioni.
        </p>
      </div>
    </>
  );
}
