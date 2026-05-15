'use client';

import { Printer } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/lib/components/shared/ui/Button';
import { useSalonSettingsStore } from '@/lib/stores/salonSettings';
import { LUME_LEGAL } from '@/lib/const/legal';

interface PrintableDocumentProps {
  documentTitle: string;
  documentSubtitle?: string;
  children: ReactNode;
}

// Salon-side legal document layout. Renders an A4-styled page that the user
// can print via the browser (Cmd/Ctrl+P → "Save as PDF"). The print stylesheet
// strips the toolbar and the app chrome; the visible page is what gets printed.
//
// Designed to live on /admin/impostazioni/legale/* routes — keeps the salon
// info from useSalonSettingsStore so titolare data stays in sync.
export function PrintableDocument({ documentTitle, documentSubtitle, children }: PrintableDocumentProps) {
  const settings = useSalonSettingsStore((s) => s.settings);
  const isLoading = useSalonSettingsStore((s) => s.isLoading);

  const titolare = settings?.fiscal?.ragione_sociale?.trim() || settings?.name || 'Salone';
  const piva = settings?.fiscal?.p_iva?.trim();
  const cf = settings?.fiscal?.codice_fiscale?.trim();
  const addressParts = [
    settings?.address,
    [settings?.cap, settings?.city].filter(Boolean).join(' '),
    settings?.province,
  ].filter((p): p is string => Boolean(p && p.trim()));
  const address = addressParts.join(', ');
  const phone = settings?.phone?.trim();
  const email = settings?.public_email?.trim();

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar — hidden when printing. */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-base font-semibold text-foreground">{documentTitle}</h2>
          {documentSubtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">{documentSubtitle}</p>
          )}
        </div>
        <Button
          variant="primary"
          leadingIcon={Printer}
          onClick={() => window.print()}
          disabled={isLoading || !settings}
        >
          Stampa / Salva PDF
        </Button>
      </div>

      {/* Document — A4 framing, neutral typography, prints cleanly. */}
      <article className="document-sheet">
        <header className="document-header">
          <div>
            <p className="document-eyebrow">Documento generato da Lume</p>
            <h1 className="document-title">{documentTitle}</h1>
          </div>
          <p className="document-meta">
            Versione del {new Date().toLocaleDateString('it-IT')}
          </p>
        </header>

        <section className="document-titolare">
          <h2 className="document-section-title">Titolare del trattamento</h2>
          <p className="document-titolare-name">{titolare}</p>
          <ul className="document-titolare-meta">
            {piva && (
              <li>
                <strong>P. IVA:</strong> {piva}
              </li>
            )}
            {cf && (
              <li>
                <strong>Codice Fiscale:</strong> {cf}
              </li>
            )}
            {address && (
              <li>
                <strong>Sede:</strong> {address}
              </li>
            )}
            {phone && (
              <li>
                <strong>Telefono:</strong> {phone}
              </li>
            )}
            {email && (
              <li>
                <strong>Email:</strong> {email}
              </li>
            )}
            {!piva && !cf && (
              <li className="document-warning">
                ⚠ Per stampare un documento valido, completa la sezione{' '}
                <a href="/admin/impostazioni/salone/fatturazione">Fatturazione</a> con P. IVA o
                Codice Fiscale.
              </li>
            )}
          </ul>
        </section>

        <div className="document-body">{children}</div>

        <footer className="document-footer">
          <p>
            Il presente modulo è generato automaticamente da {LUME_LEGAL.name}, gestionale per
            saloni. Conserva l&apos;originale firmato per almeno 10 anni
            (art. 2946 c.c. e obblighi fiscali).
          </p>
        </footer>
      </article>

      <style jsx global>{`
        .document-sheet {
          background: white;
          color: #18181b;
          padding: 32px 40px;
          border: 1px solid #e4e4e7;
          border-radius: 12px;
          max-width: 210mm;
          margin: 0 auto;
          font-family: 'Geist', system-ui, sans-serif;
          line-height: 1.55;
        }
        :global(.dark) .document-sheet {
          background: white;
          color: #18181b;
        }
        .document-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          padding-bottom: 12px;
          border-bottom: 2px solid #18181b;
        }
        .document-eyebrow {
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #71717a;
          margin: 0 0 4px;
        }
        .document-title {
          font-size: 22px;
          font-weight: 700;
          color: #18181b;
          margin: 0;
          line-height: 1.2;
        }
        .document-meta {
          font-size: 11px;
          color: #71717a;
          margin: 0;
        }
        .document-titolare {
          margin: 20px 0 24px;
          padding: 16px;
          background: #fafafa;
          border-left: 3px solid #6366f1;
          font-size: 12px;
        }
        .document-section-title {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #71717a;
          margin: 0 0 6px;
        }
        .document-titolare-name {
          font-size: 14px;
          font-weight: 700;
          color: #18181b;
          margin: 0 0 4px;
        }
        .document-titolare-meta {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 4px 16px;
        }
        .document-titolare-meta li {
          font-size: 11px;
          color: #3f3f46;
        }
        .document-warning {
          color: #b45309 !important;
          font-style: italic;
        }
        .document-warning a {
          color: #b45309;
          text-decoration: underline;
        }
        .document-body {
          font-size: 12px;
          color: #18181b;
        }
        .document-body h2 {
          font-size: 14px;
          font-weight: 700;
          margin: 22px 0 8px;
          color: #18181b;
        }
        .document-body h3 {
          font-size: 12px;
          font-weight: 700;
          margin: 16px 0 4px;
          color: #27272a;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .document-body p {
          margin: 0 0 8px;
        }
        .document-body ul,
        .document-body ol {
          margin: 0 0 12px;
          padding-left: 20px;
        }
        .document-body li {
          margin-bottom: 4px;
        }
        .document-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
          font-size: 11px;
        }
        .document-body th,
        .document-body td {
          border: 1px solid #d4d4d8;
          padding: 6px 8px;
          text-align: left;
          vertical-align: top;
        }
        .document-body th {
          background: #f4f4f5;
          font-weight: 600;
        }
        .document-signature {
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px solid #d4d4d8;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .document-signature-block {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .document-signature-line {
          border-bottom: 1px solid #18181b;
          height: 18px;
        }
        .document-signature-label {
          font-size: 10px;
          color: #52525b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .document-checkbox-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin: 6px 0;
        }
        .document-checkbox {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 1.5px solid #18181b;
          border-radius: 2px;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .document-footer {
          margin-top: 28px;
          padding-top: 12px;
          border-top: 1px solid #e4e4e7;
          font-size: 9px;
          color: #71717a;
        }
        .document-footer p {
          margin: 0;
        }

        @media print {
          @page {
            size: A4;
            margin: 16mm;
          }
          body {
            background: white !important;
          }
          .document-sheet {
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            max-width: none !important;
            box-shadow: none !important;
          }
          /* Hide everything outside the document. Apps use various wrappers,
             so we whitelist the article instead of blacklisting siblings. */
          body > *:not(article):not(script) {
            display: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
