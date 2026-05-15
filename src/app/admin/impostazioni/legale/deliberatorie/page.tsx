'use client';

import Link from 'next/link';
import { FileText, ChevronRight, Sparkles } from 'lucide-react';
import { DELIBERATORIE } from '@/lib/legal/deliberatorie';

export default function DeliberatoriePage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Deliberatorie</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          Modulistica pre-compilata che il salone consegna ai propri clienti per essere
          conforme al GDPR e al Codice Privacy. Ogni modulo legge automaticamente i dati
          della tua attività dalle impostazioni.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30 p-4 mb-6 text-sm text-amber-800 dark:text-amber-200 flex gap-3">
        <Sparkles className="size-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Consegna obbligatoria al primo appuntamento.</p>
          <p className="mt-0.5 text-xs">
            L&apos;informativa privacy va data a ogni nuovo cliente. I consensi sono richiesti
            solo se tratti i relativi dati (allergie, foto, marketing, …).
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {DELIBERATORIE.map((d) => (
          <li key={d.slug}>
            <Link
              href={`/admin/impostazioni/legale/deliberatorie/${d.slug}`}
              className="flex items-start gap-3 rounded-xl border border-border bg-white dark:bg-zinc-900 p-4 hover:border-primary/50 hover:shadow-sm transition"
            >
              <FileText className="size-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">{d.title}</p>
                  {d.required && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      Obbligatoria
                    </span>
                  )}
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    · {d.legalBasis}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{d.description}</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground mt-1 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Hai bisogno del Registro dei Trattamenti?</p>
        <p>
          Il <Link href="/admin/impostazioni/legale/registro-trattamenti" className="text-primary underline">Registro
          dei Trattamenti</Link> (Art. 30 GDPR) è obbligatorio per ogni titolare che tratta dati
          particolari. Lume lo genera automaticamente in base alle tue impostazioni.
        </p>
      </div>
    </>
  );
}
