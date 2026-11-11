import { useState } from 'react';
import { Archive, ArchiveRestore, CreditCard, Gift, KeyRound, Mail, Phone, Plane, Trash2 } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { DetailHero } from './DetailHero';
import { DetailHeroActions } from './DetailHeroActions';
import { DetailSection } from './DetailSection';
import { DetailChip } from './DetailChip';
import { HeroAvatar } from './HeroAvatar';
import { ContactRow } from './ContactRow';
import { StatTile } from './StatTile';
import { StatusDot } from '../StatusDot';
import { messagePopup } from '../messagePopup/messagePopup';
import {
  cellNumClass,
  cellStrongClass,
  tableCardClass,
  tableClass,
  tbodyClass,
  tdClass,
  thClass,
  theadClass,
  trClass,
} from '../table/tableStyles';

interface ClientPageProps {
  /** Archived clients lose "Modifica" and show the archived status. */
  archived: boolean;
  /** Client without a login: shows the "Aggiungi credenziali" chip. */
  withoutAccount: boolean;
  tourist: boolean;
  /** Client with no visits in the last 12 months. */
  noVisits: boolean;
}

const fiches = [
  { date: '18/10/2026', services: 'Colore, Piega', operator: 'Sara', total: '68,00 €' },
  { date: '20/09/2026', services: 'Taglio donna, Piega', operator: 'Sara', total: '45,00 €' },
  { date: '23/08/2026', services: 'Trattamento alla cheratina', operator: 'Luca', total: '85,00 €' },
];

const coupons = [
  { kind: 'gift_card', label: 'Gift card · 50,00 €', role: 'destinatario', until: '31/12/2026', status: 'attivo', tone: 'success' as const },
  { kind: 'coupon', label: 'Coupon · 10%', role: 'acquirente', until: '30/06/2026', status: 'scaduto', tone: 'neutral' as const },
];

/**
 * A client detail page assembled only from the shared detail parts, laid out
 * like src/app/admin/clienti/[id]/page.tsx.
 */
function ClientPage({ archived, withoutAccount, tourist, noVisits }: ClientPageProps) {
  const [editing, setEditing] = useState(false);
  const noop = () => {};
  const copy = (what: string) => () => messagePopup.getState().success(`${what} copiato negli appunti`);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--lume-bg)]">
      <DetailHero
        onBack={noop}
        avatar={<HeroAvatar initials="GR" />}
        title="Giulia Rossi"
        chips={
          <>
            {archived && <StatusDot tone="warning" className="text-xs">Archiviato</StatusDot>}
            {tourist && (
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--lume-text)]">
                <Plane className="size-3.5 text-[var(--lume-text-muted)]" aria-hidden />
                Turista
              </span>
            )}
            {withoutAccount && !editing && !archived && (
              <DetailChip icon={KeyRound} onClick={() => setEditing(true)} title="Aggiungi email o telefono per creare l'accesso">
                Senza account · Aggiungi credenziali
              </DetailChip>
            )}
          </>
        }
        meta={
          <>
            <span>Donna</span>
            <span aria-hidden>·</span>
            <span>nata il 14 maggio 1991</span>
          </>
        }
        aside={
          !editing && (
            <div className="flex flex-col gap-1 max-w-70">
              <ContactRow icon={Mail} value="giulia.rossi@gmail.com" emptyLabel="Nessuna email" onCopy={copy('Email')} />
              <ContactRow icon={Phone} value="+39 347 812 4590" emptyLabel="Nessun telefono" onCopy={copy('Numero')} />
            </div>
          )
        }
        actions={
          <DetailHeroActions
            isEditing={editing}
            isLocked={archived}
            onEdit={() => setEditing(true)}
            onCancel={() => setEditing(false)}
            onSave={() => {
              setEditing(false);
              messagePopup.getState().success('Cliente aggiornato');
            }}
            menuItems={[
              { label: archived ? 'Ripristina' : 'Archivia', icon: archived ? ArchiveRestore : Archive, onClick: noop },
              { label: 'Elimina', icon: Trash2, onClick: noop, destructive: true },
            ]}
          />
        }
      />

      <div className="px-6 lg:px-10 py-8 max-w-5xl w-full mx-auto flex flex-col gap-12">
        <DetailSection index={0} label="Valutazione · ultimi 12 mesi">
          {noVisits ? (
            <p className="text-sm text-[var(--lume-text-muted)]">Nessuna visita negli ultimi 12 mesi.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatTile label="Spesa totale" value="642,00 €" accent={{ tone: 'success', text: 'Top 20%' }} />
              <StatTile label="Visite" value="11" accent={{ tone: 'info', text: 'Top 40%' }} />
            </div>
          )}
        </DetailSection>

        <DetailSection index={1} label="Storico fiche">
          <div className={tableCardClass}>
            <table className={tableClass}>
              <thead className={theadClass}>
                <tr>
                  <th className={thClass()}>Data</th>
                  <th className={thClass()}>Servizi</th>
                  <th className={thClass()}>Operatore</th>
                  <th className={thClass({ align: 'right' })}>Totale</th>
                </tr>
              </thead>
              <tbody className={tbodyClass}>
                {fiches.map((f) => (
                  <tr key={f.date} className={trClass()}>
                    <td className={`${tdClass} ${cellNumClass}`}>{f.date}</td>
                    <td className={`${tdClass} ${cellStrongClass}`}>{f.services}</td>
                    <td className={tdClass}>{f.operator}</td>
                    <td className={`${tdClass} ${cellNumClass} text-right text-[var(--lume-text)]`}>{f.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DetailSection>

        <DetailSection index={2} label="Coupon e gift card">
          <ul className="divide-y divide-line border-y border-line">
            {coupons.map((c) => {
              const Icon = c.kind === 'gift_card' ? CreditCard : Gift;
              return (
                <li key={c.label} className="py-3 flex items-center gap-3">
                  <Icon
                    className={`size-4 shrink-0 ${c.kind === 'gift_card' ? 'text-success-strong' : 'text-info-strong'}`}
                    aria-hidden
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[var(--lume-text)]">{c.label}</span>
                      <span className="text-xs text-[var(--lume-text-muted)]">{c.role}</span>
                    </div>
                    <span className="text-xs text-[var(--lume-text-secondary)]">
                      Valido fino al <span className="tabular-nums">{c.until}</span>
                    </span>
                  </div>
                  <StatusDot tone={c.tone} className="text-xs">{c.status}</StatusDot>
                </li>
              );
            })}
          </ul>
        </DetailSection>

        <DetailSection index={3} label="Note">
          <p className="text-sm text-[var(--lume-text)] whitespace-pre-wrap leading-relaxed max-w-prose">
            Preferisce appuntamenti il sabato mattina. Cute sensibile: usare lo shampoo delicato.
          </p>
        </DetailSection>
      </div>
    </div>
  );
}

const meta: Meta<typeof ClientPage> = {
  title: 'Layout/Scheda cliente',
  component: ClientPage,
  args: { archived: false, withoutAccount: true, tourist: false, noVisits: false },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A client detail page built from the shared detail parts: `DetailHero` with `HeroAvatar`, `DetailChip`, `ContactRow` and `DetailHeroActions`, then stacked `DetailSection`s holding `StatTile`s, a table in the shared table style and a coupon list. Use it as the pattern for any new detail page.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ClientPage>;

export const Playground: Story = {};

export const WithAccount: Story = { name: 'Con account', args: { withoutAccount: false } };

export const Archived: Story = { name: 'Archiviato', args: { archived: true, tourist: true } };

export const NoVisits: Story = { name: 'Senza visite', args: { noVisits: true } };
