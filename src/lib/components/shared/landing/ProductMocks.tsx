import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Info,
  Package,
  Users,
  UserRound,
} from 'lucide-react';
import { CATEGORY_PICKER_COLORS } from '@/lib/const/category-colors';
import { cn } from '@/lib/utils';

/* Static, decorative product screens for the landing page. They mirror the
   real app (FicheBlock, TimeGrid, OperatorFilterButton): tonal fills in the
   client/category swatches, a coloured dot, an inset edge in the block's own
   colour, mono times, the indigo now-line. Built in HTML so they follow the
   theme; the caller marks them aria-hidden. Colours come from the same data
   palette the app offers in its pickers. */

const SW = {
  red: CATEGORY_PICKER_COLORS[0],
  orange: CATEGORY_PICKER_COLORS[1],
  yellow: CATEGORY_PICKER_COLORS[2],
  green: CATEGORY_PICKER_COLORS[3],
  teal: CATEGORY_PICKER_COLORS[5],
  cyan: CATEGORY_PICKER_COLORS[6],
  blue: CATEGORY_PICKER_COLORS[7],
  indigo: CATEGORY_PICKER_COLORS[8],
  violet: CATEGORY_PICKER_COLORS[9],
  pink: CATEGORY_PICKER_COLORS[10],
  gray: CATEGORY_PICKER_COLORS[11],
} as const;

/** Same mix the calendar uses, so a fill sits on any surface in both themes. */
function tint(color: string, percent: number): string {
  return `color-mix(in oklab, ${color} ${percent}%, transparent)`;
}

/** Text in a swatch's hue that stays readable in both themes. */
function ink(color: string): string {
  return `color-mix(in oklab, ${color} 62%, var(--lume-text))`;
}

function Avatar({ initials, color, size = 'size-6' }: { initials: string; color: string; size?: string }) {
  return (
    <span
      className={cn(size, 'rounded-full grid place-items-center text-2xs font-medium shrink-0')}
      style={{ backgroundColor: tint(color, 18), color: ink(color) }}
    >
      {initials}
    </span>
  );
}

function Dot({ color }: { color: string }) {
  return <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: color }} />;
}

export function WindowFrame({
  url,
  children,
  className,
}: {
  url: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('lp-window', className)} aria-hidden="true">
      <div className="lp-window-bar">
        <div className="lp-window-dots">
          <i />
          <i />
          <i />
        </div>
        <div className="h-5 px-3 rounded-md bg-hover flex items-center tabular-nums text-2xs text-[var(--lume-text-muted)] w-72 max-w-[50%]">
          {url}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── Calendar ─────────────────────────────────────────────────────────── */

const HOUR_PX = 64;
const START_HOUR = 9;
const HOURS = [9, 10, 11, 12, 13, 14];
const NOW = 10 + 40 / 60;

type Appt = {
  start: number; // decimal hours
  end: number;
  name: string;
  service: string;
  color: string;
  selected?: boolean;
  online?: boolean;
};

type Operator = { name: string; color: string; appts: Appt[] };

const OPERATORS: Operator[] = [
  {
    name: 'Marco',
    color: SW.blue,
    appts: [
      { start: 9, end: 9.75, name: 'Marco Ricci', service: 'Taglio e barba', color: SW.indigo, selected: true },
      { start: 11, end: 12, name: 'Alessia Villa', service: 'Trattamento', color: SW.teal },
      { start: 12.25, end: 13, name: 'Paolo Galli', service: 'Taglio', color: SW.orange },
      { start: 14, end: 14.75, name: 'Irene Fabbri', service: 'Taglio donna', color: SW.violet },
    ],
  },
  {
    name: 'Elena',
    color: SW.pink,
    appts: [
      { start: 9, end: 10, name: 'Sofia Bruno', service: 'Piega', color: SW.yellow },
      { start: 10, end: 11.5, name: 'Giulia Marino', service: 'Colore', color: SW.violet, online: true },
      { start: 12, end: 12.75, name: 'Chiara Longo', service: 'Piega', color: SW.cyan },
    ],
  },
  {
    name: 'Luca',
    color: SW.teal,
    appts: [
      { start: 9.5, end: 10.25, name: 'Roberto Testa', service: 'Taglio', color: SW.green },
      { start: 11, end: 11.75, name: 'Fabio Conti', service: 'Taglio e barba', color: SW.orange },
      { start: 13, end: 13.5, name: 'Davide Serra', service: 'Barba', color: SW.blue },
    ],
  },
];

function fmt(h: number) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

const NAV = [
  { icon: Calendar, label: 'Calendario', active: true },
  { icon: ClipboardList, label: 'Fiches' },
  { icon: Users, label: 'Clienti' },
  { icon: Package, label: 'Magazzino' },
  { icon: BarChart3, label: 'Bilancio' },
];

function Sidebar() {
  return (
    <div className="w-47 shrink-0 border-r border-line bg-[var(--lume-surface)] p-3 flex flex-col gap-0.5">
      <div className="flex items-center gap-2 px-2 h-9 mb-2">
        <Avatar initials="SA" color={SW.indigo} size="size-6" />
        <span className="text-compact font-medium tracking-tight text-[var(--lume-text)]">Salone Aurora</span>
      </div>
      {NAV.map(({ icon: Icon, label, active }) => (
        <div
          key={label}
          className={cn(
            'flex items-center gap-2.5 h-8 px-2 rounded-md text-compact',
            active
              ? 'bg-active text-[var(--lume-text)] font-medium'
              : 'text-[var(--lume-text-secondary)]',
          )}
        >
          <Icon className="size-4 shrink-0" strokeWidth={1.75} />
          {label}
        </div>
      ))}
    </div>
  );
}

function Block({ a }: { a: Appt }) {
  const color = a.selected ? 'var(--lume-accent)' : a.color;
  const heightPx = (a.end - a.start) * HOUR_PX - 2;
  return (
    <div
      className="absolute left-0.5 right-0.5 rounded-md overflow-hidden flex flex-col gap-0.5 px-2 py-1.5"
      style={{
        top: (a.start - START_HOUR) * HOUR_PX + 1,
        height: heightPx,
        // Tint over the panel colour, as the real block does, so grid lines stay behind it.
        backgroundColor: 'var(--lume-panel)',
        backgroundImage: `linear-gradient(${tint(color, a.selected ? 20 : 16)}, ${tint(color, a.selected ? 20 : 16)})`,
        boxShadow: a.selected ? '0 0 0 2px var(--lume-accent)' : `inset 0 0 0 1px ${tint(color, 28)}`,
      }}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <Dot color={color} />
        <span className="text-compact font-medium tracking-tight text-[var(--lume-text)] truncate leading-tight">
          {a.name}
        </span>
        <Info className="size-3 shrink-0 text-[var(--lume-text-muted)]" />
      </div>
      <span className="text-xs text-[var(--lume-text-secondary)] truncate leading-tight">{a.service}</span>
      {heightPx >= 56 && (
        <span className="tabular-nums text-2xs leading-tight text-[var(--lume-text-muted)]">
          {fmt(a.start)}–{fmt(a.end)}
        </span>
      )}
    </div>
  );
}

function CalendarGrid({ title = 'Martedì, 1 aprile 2026' }: { title?: string }) {
  const nowTop = (NOW - START_HOUR) * HOUR_PX;
  return (
    <div className="flex-1 min-w-0 flex flex-col bg-[var(--lume-panel)]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 h-14 px-5">
        <span className="h-8 px-3 grid place-items-center rounded-lg shadow-[inset_0_0_0_1px_var(--lume-edge)] text-compact text-[var(--lume-text)]">
          Oggi
        </span>
        <span className="size-8 grid place-items-center rounded-lg text-[var(--lume-text-secondary)] bg-hover">
          <ChevronLeft className="size-4" />
        </span>
        <span className="size-8 grid place-items-center rounded-lg text-[var(--lume-text-secondary)]">
          <ChevronRight className="size-4" />
        </span>
        <span className="ml-2 text-[length:var(--lp-text-h3)] font-medium tracking-tight text-[var(--lume-text)]">{title}</span>
        <div className="ml-auto flex items-center gap-0.5 p-0.75 rounded-lg shadow-[inset_0_0_0_1px_var(--lume-edge)] text-compact">
          <span className="px-3 h-7 grid place-items-center rounded-md bg-active text-[var(--lume-text)] font-medium">Giorno</span>
          <span className="px-3 h-7 grid place-items-center text-[var(--lume-text-secondary)]">Settimana</span>
          <span className="px-3 h-7 grid place-items-center text-[var(--lume-text-secondary)]">Mese</span>
        </div>
      </div>

      {/* Operator header */}
      <div className="flex border-b border-line">
        <div className="w-16 shrink-0" />
        {OPERATORS.map((op) => (
          <div
            key={op.name}
            className="flex-1 flex items-center gap-2 h-11 px-3 text-sm font-medium text-[var(--lume-text)]"
          >
            <Avatar initials={op.name[0]} color={op.color} />
            {op.name}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="relative flex mt-2" style={{ height: HOURS.length * HOUR_PX }}>
        <div className="w-16 shrink-0 relative">
          {HOURS.map((h, i) =>
            Math.abs(h - NOW) < 0.2 ? null : (
              <span
                key={h}
                className="absolute right-3 -translate-y-1/2 tabular-nums text-2xs leading-none text-[var(--lume-text-secondary)]"
                style={{ top: i * HOUR_PX }}
              >
                {fmt(h)}
              </span>
            ),
          )}
        </div>
        {OPERATORS.map((op) => (
          <div key={op.name} className="flex-1 relative border-l border-line">
            {/* Past time: the faintest tint up to the now-line */}
            <div
              className="absolute inset-x-0 top-0 bg-[color-mix(in_oklab,var(--lume-text)_2.5%,transparent)]"
              style={{ height: nowTop }}
            />
            {HOURS.map((h, i) => (
              <div key={h}>
                <div className="absolute inset-x-0 border-t border-line" style={{ top: i * HOUR_PX }} />
                <div
                  className="absolute inset-x-0 border-t border-dashed border-line"
                  style={{ top: i * HOUR_PX + HOUR_PX / 2 }}
                />
              </div>
            ))}
            {op.appts.map((a) => (
              <Block key={a.name} a={a} />
            ))}
          </div>
        ))}
        {/* Now line: indigo, with its time chip in the gutter */}
        <div className="absolute inset-x-0 h-0 flex items-center" style={{ top: nowTop }}>
          <div className="w-16 shrink-0 flex justify-end pr-1.5">
            <span className="tabular-nums text-2xs leading-none px-1 py-0.75 rounded-sm bg-[var(--lume-accent)] text-[var(--lume-text-on-accent)] shadow-[inset_0_0_0_3px_var(--lume-panel)]">
              {fmt(NOW)}
            </span>
          </div>
          <div className="relative flex-1 h-px bg-[var(--lume-accent)]">
            <span className="absolute left-0 top-1/2 size-1.75 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--lume-accent)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusWord({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--lume-text-secondary)]">
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {children}
    </span>
  );
}

function ClientPanel() {
  const rows = [
    ['Ultimo appuntamento', '15 marzo, taglio'],
    ['Preferisce', 'Scalato ai lati'],
    ['Operatore abituale', 'Marco'],
  ];
  return (
    <div className="w-65 shrink-0 border-l border-line bg-[var(--lume-panel)] p-5 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Avatar initials="MR" color={SW.indigo} size="size-10 text-compact" />
        <div className="min-w-0 flex flex-col gap-0.5">
          <div className="text-sm font-medium text-[var(--lume-text)]">Marco Ricci</div>
          <StatusWord color="var(--lume-success-fg)">Cliente da 3 anni</StatusWord>
        </div>
      </div>
      <div className="flex flex-col">
        {rows.map(([k, v]) => (
          <div key={k} className="py-2.5 border-t border-line">
            <div className="text-2xs text-[var(--lume-text-muted)]">{k}</div>
            <div className="text-compact text-[var(--lume-text)]">{v}</div>
          </div>
        ))}
        <div className="py-2.5 border-y border-line flex items-baseline justify-between">
          <span className="text-2xs text-[var(--lume-text-muted)]">Visite totali</span>
          <span className="tabular-nums text-compact text-[var(--lume-text)]">12</span>
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <div className="h-9 rounded-lg shadow-[inset_0_0_0_1px_var(--lume-edge)] grid place-items-center text-compact font-medium text-[var(--lume-text)]">
          Apri fiche
        </div>
        <div className="h-9 rounded-lg shadow-[inset_0_0_0_1px_var(--lume-edge)] grid place-items-center text-compact font-medium text-[var(--lume-text)]">
          Scheda cliente
        </div>
      </div>
    </div>
  );
}

/** The full calendar screen used in the hero. At least 1120px wide so narrow screens crop it. */
export function CalendarScreen() {
  return (
    <div className="lp-hero-screen flex w-full min-w-280 bg-[var(--lume-surface-raised)]">
      <Sidebar />
      <CalendarGrid />
      <ClientPanel />
    </div>
  );
}

/** A narrower calendar for the steps section. */
export function CalendarCompact() {
  return (
    <div className="flex w-190 h-full">
      <CalendarGrid title="Martedì, 1 aprile" />
    </div>
  );
}

/* ── Step screens ─────────────────────────────────────────────────────── */

function FakeField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[var(--lume-text)]">{label}</span>
      <span className="h-9 px-3 rounded-lg shadow-[inset_0_0_0_1px_var(--lume-edge)] bg-[var(--lume-control-bg)] flex items-center text-compact text-[var(--lume-text-secondary)]">
        {value}
      </span>
    </div>
  );
}

export function AccountScreen() {
  return (
    <div className="lp-stage w-190 h-full min-h-90 p-10 flex items-start">
      {/* ds-ignore: drawn sign-up card in a miniature product screen; it floats on a drop shadow that surface-card does not have */}
      <div className="w-85 rounded-xl bg-[var(--lume-surface-raised)] shadow-[inset_0_0_0_1px_var(--lume-line),0_16px_32px_-20px_var(--shadow-color)] p-6 flex flex-col gap-4">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((n) => (
            <span
              key={n}
              className={cn(
                'h-1 flex-1 rounded-full',
                n === 1 ? 'bg-[var(--lume-accent)]' : 'bg-active',
              )}
            />
          ))}
        </div>
        <div>
          <div className="text-[length:var(--lp-text-body)] font-medium tracking-tight text-[var(--lume-text)]">Account</div>
          <div className="text-xs text-[var(--lume-text-secondary)]">Crea le tue credenziali di accesso</div>
        </div>
        <FakeField label="Email" value="giulia@saloneaurora.it" />
        <FakeField label="Password" value="••••••••••" />
        <div className="h-9 rounded-lg bg-[var(--lume-button-accent-bg)] text-[var(--lume-button-accent-fg)] grid place-items-center text-compact font-medium">
          Avanti
        </div>
      </div>
    </div>
  );
}

const SERVICES: [string, string, string, string][] = [
  ['Taglio donna', '45 min', '35,00 €', SW.violet],
  ['Piega', '30 min', '20,00 €', SW.yellow],
  ['Colore', '90 min', '55,00 €', SW.pink],
  ['Taglio e barba', '45 min', '28,00 €', SW.blue],
  ['Trattamento', '60 min', '40,00 €', SW.teal],
];

const STAFF: [string, string][] = [
  ['Marco', SW.blue],
  ['Elena', SW.pink],
  ['Luca', SW.teal],
];

export function DataScreen() {
  return (
    <div className="w-190 h-full min-h-90 bg-[var(--lume-panel)] flex">
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[length:var(--lp-text-h3)] font-medium tracking-tight text-[var(--lume-text)]">Servizi</span>
          <span className="h-8 px-3 rounded-lg bg-[var(--lume-button-accent-bg)] text-[var(--lume-button-accent-fg)] grid place-items-center text-xs font-medium">
            Nuovo servizio
          </span>
        </div>
        <div className="grid grid-cols-[1fr_80px_90px] text-2xs text-[var(--lume-text-muted)] pb-2">
          <span>Nome</span>
          <span>Durata</span>
          <span className="text-right">Prezzo</span>
        </div>
        {SERVICES.map(([n, d, p, c]) => (
          <div
            key={n}
            className="grid grid-cols-[1fr_80px_90px] items-center h-11 border-t border-line text-compact"
          >
            <span className="flex items-center gap-2 text-[var(--lume-text)]">
              <Dot color={c} />
              {n}
            </span>
            <span className="tabular-nums text-xs text-[var(--lume-text-secondary)]">{d}</span>
            <span className="tabular-nums text-xs text-[var(--lume-text)] text-right">{p}</span>
          </div>
        ))}
      </div>
      <div className="w-57.5 border-l border-line p-6 flex flex-col gap-3">
        <span className="text-xs text-[var(--lume-text-muted)]">Operatori</span>
        {STAFF.map(([n, c]) => (
          <div key={n} className="flex items-center gap-2.5 text-compact text-[var(--lume-text)]">
            <Avatar initials={n[0]} color={c} size="size-7" />
            {n}
          </div>
        ))}
        <div className="flex items-center gap-2.5 text-compact text-[var(--lume-text-muted)]">
          <span className="size-7 rounded-full shadow-[inset_0_0_0_1px_var(--lume-edge)] grid place-items-center">
            <UserRound className="size-3.5" />
          </span>
          Aggiungi operatore
        </div>
      </div>
    </div>
  );
}

/* ── Bento visuals ────────────────────────────────────────────────────── */

export function MiniWeek() {
  const days = ['Lun 31', 'Mar 1', 'Mer 2', 'Gio 3', 'Ven 4'];
  // [column, row, span, colour, name]
  const blocks: [number, number, number, string, string][] = [
    [0, 0, 2, SW.violet, 'Irene F.'], [0, 3, 1, SW.orange, 'Paolo G.'],
    [1, 0, 1, SW.indigo, 'Marco R.'], [1, 1, 2, SW.yellow, 'Sofia B.'], [1, 4, 1, SW.teal, 'Alessia V.'],
    [2, 1, 1, SW.green, 'Roberto T.'], [2, 2, 2, SW.pink, 'Giulia M.'],
    [3, 0, 3, SW.cyan, 'Chiara L.'], [3, 4, 1, SW.blue, 'Davide S.'],
    [4, 1, 2, SW.violet, 'Anna P.'], [4, 3, 1, SW.orange, 'Fabio C.'],
  ];
  return (
    <div className="lp-mini p-4 w-140">
      <div className="grid grid-cols-5 gap-2 mb-2">
        {days.map((d, i) => (
          <span
            key={d}
            className={cn(
              'text-2xs',
              i === 1 ? 'text-[var(--lume-text)] font-medium' : 'text-[var(--lume-text-muted)]',
            )}
          >
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2 relative h-39">
        {days.map((d, col) => (
          <div key={d} className="relative border-t border-line">
            {blocks
              .filter(([c]) => c === col)
              .map(([, row, span, color, name]) => (
                <div
                  key={row}
                  className="absolute inset-x-0 rounded-sm px-1.5 py-1 flex items-start gap-1 overflow-hidden"
                  style={{
                    top: row * 31 + 4,
                    height: span * 31 - 4,
                    backgroundColor: tint(color, 16),
                    boxShadow: `inset 0 0 0 1px ${tint(color, 28)}`,
                  }}
                >
                  <span className="size-1.5 mt-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-2xs font-medium text-[var(--lume-text)] truncate">{name}</span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MiniClient() {
  const visits: [string, string, string, string][] = [
    ['15 mar', 'Taglio', '25,00 €', SW.blue],
    ['8 feb', 'Taglio e barba', '28,00 €', SW.blue],
    ['4 gen', 'Trattamento', '40,00 €', SW.teal],
  ];
  return (
    <div className="lp-mini p-5 w-115 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar initials="MR" color={SW.indigo} size="size-9 text-xs" />
        <div className="flex flex-col gap-0.5">
          <div className="text-compact font-medium text-[var(--lume-text)]">Marco Ricci</div>
          <StatusWord color="var(--lume-success-fg)">Cliente abituale</StatusWord>
        </div>
      </div>
      <div className="flex flex-col">
        {visits.map(([d, s, p, c]) => (
          <div
            key={d}
            className="grid grid-cols-[64px_1fr_auto] items-center h-9 border-t border-line text-xs"
          >
            <span className="tabular-nums text-2xs text-[var(--lume-text-muted)]">{d}</span>
            <span className="flex items-center gap-2 text-[var(--lume-text)]">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: c }} />
              {s}
            </span>
            <span className="tabular-nums text-2xs text-[var(--lume-text-secondary)]">{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MiniStock() {
  const items: [string, number, 'low' | 'ok'][] = [
    ['Shampoo nutriente 250 ml', 14, 'ok'],
    ['Maschera ristrutturante', 2, 'low'],
    ['Cera opaca', 9, 'ok'],
    ['Ossigeno 20 volumi', 1, 'low'],
  ];
  return (
    <div className="lp-mini p-5 w-115 max-sm:w-full flex flex-col">
      {items.map(([n, q, state]) => (
        <div
          key={n}
          className="grid grid-cols-[1fr_32px_100px] gap-2 items-center h-10 border-b border-line text-xs"
        >
          <span className="text-[var(--lume-text)] truncate">{n}</span>
          <span className="tabular-nums text-[var(--lume-text-secondary)]">{q}</span>
          {state === 'low' ? (
            <StatusWord color="var(--lume-warning-fg)">Da ordinare</StatusWord>
          ) : (
            <StatusWord color="var(--lume-success-fg)">Disponibile</StatusWord>
          )}
        </div>
      ))}
    </div>
  );
}

export function MiniBalance() {
  const months = ['Nov', 'Dic', 'Gen', 'Feb', 'Mar', 'Apr'];
  const income = [52, 70, 48, 61, 72, 80];
  const costs = [20, 26, 18, 22, 25, 19];
  return (
    <div className="lp-mini p-5 w-115 flex gap-6">
      <div className="flex flex-col gap-4 shrink-0">
        <div>
          <div className="tabular-nums text-xl font-light tracking-tight text-[var(--lume-text)]">4.820 €</div>
          <div className="flex items-center gap-1.5 text-2xs text-[var(--lume-text-muted)]">
            <span className="size-1.5 rounded-full bg-[var(--lume-chart-entrate)]" />
            Entrate di aprile
          </div>
        </div>
        <div>
          <div className="tabular-nums text-xl font-light tracking-tight text-[var(--lume-text)]">1.130 €</div>
          <div className="flex items-center gap-1.5 text-2xs text-[var(--lume-text-muted)]">
            <span className="size-1.5 rounded-full bg-[var(--lume-chart-uscite)]" />
            Uscite di aprile
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex-1 flex items-end gap-2.5 h-32 border-b border-line">
          {months.map((m, i) => (
            <div key={m} className="flex-1 flex items-end justify-center gap-0.75 h-full">
              <div className="w-1/2 rounded-t-sm bg-[var(--lume-chart-entrate)]" style={{ height: `${income[i]}%` }} />
              <div className="w-1/2 rounded-t-sm bg-[var(--lume-chart-uscite)]" style={{ height: `${costs[i]}%` }} />
            </div>
          ))}
        </div>
        <div className="flex gap-2.5">
          {months.map((m) => (
            <span key={m} className="flex-1 text-center tabular-nums text-2xs text-[var(--lume-text-muted)]">
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
