'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PrintableDocument } from '@/lib/components/admin/legale/PrintableDocument';
import { RegistroTrattamenti } from '@/lib/components/admin/legale/templates/RegistroTrattamenti';

export default function RegistroTrattamentiPage() {
  return (
    <>
      <Link
        href="/admin/impostazioni/legale/deliberatorie"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 print:hidden"
      >
        <ArrowLeft className="size-3.5" />
        Torna alle deliberatorie
      </Link>

      <PrintableDocument
        documentTitle="Registro dei trattamenti"
        documentSubtitle="Art. 30 GDPR · auto-generato in base alla configurazione del salone"
      >
        <RegistroTrattamenti />
      </PrintableDocument>
    </>
  );
}
