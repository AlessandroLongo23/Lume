import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import {
  CellEmpty,
  SortIndicator,
  cellNumClass,
  cellStrongClass,
  tableCardClass,
  tableClass,
  tableMessageClass,
  tbodyClass,
  tdClass,
  thClass,
  theadClass,
  trClass,
} from './tableStyles';
import { StatusDot, type StatusTone } from '../StatusDot';
import { Pagination } from '@/lib/components/admin/table/Pagination';

const meta: Meta<typeof SortIndicator> = {
  title: 'Dati/TableStyles',
  component: SortIndicator,
  args: { direction: 'asc' },
  argTypes: { direction: { control: 'radio', options: [false, 'asc', 'desc'] } },
  parameters: {
    docs: {
      description: {
        component:
          'The shared look of every admin data table, as class strings (`tableCardClass`, `thClass`, `trClass`, `tdClass`, …) that a table borrows while keeping its own logic. Two small parts come with it: `SortIndicator` beside a sortable header (one arrow when sorted, a faint chevron on hover otherwise) and `CellEmpty` for a cell with no data.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof SortIndicator>;

export const Playground: Story = {};

interface Row {
  id: number;
  name: string;
  phone: string | null;
  lastVisit: string | null;
  lastVisitSort: number;
  spent: number;
  status: { tone: StatusTone; label: string };
}

const firstNames = ['Giulia', 'Marco', 'Francesca', 'Luca', 'Chiara', 'Alessandro', 'Sara', 'Davide', 'Elena', 'Matteo', 'Martina', 'Paolo'];
const lastNames = ['Rossi', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'Esposito', 'Fontana'];
const statuses: Row['status'][] = [
  { tone: 'success', label: 'Attivo' },
  { tone: 'success', label: 'Attivo' },
  { tone: 'warning', label: 'Dati incompleti' },
  { tone: 'success', label: 'Attivo' },
  { tone: 'muted', label: 'Archiviato' },
];

const rows: Row[] = Array.from({ length: 24 }, (_, i) => {
  const day = ((i * 7) % 28) + 1;
  const month = 10 - (i % 4);
  return {
    id: i,
    name: `${firstNames[i % 12]} ${lastNames[(i * 5 + Math.floor(i / 12)) % 12]}`,
    phone: i % 6 === 3 ? null : `+39 3${40 + (i % 9)} ${100 + i * 37} ${1000 + i * 113}`.slice(0, 17),
    lastVisit: i % 8 === 5 ? null : `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/2026`,
    lastVisitSort: i % 8 === 5 ? 0 : month * 100 + day,
    spent: Math.round(((i * 97) % 900) + 45),
    status: statuses[i % statuses.length],
  };
});

const eur = (n: number) => n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

type SortKey = 'name' | 'lastVisit' | 'spent';

export const ClientsTable: Story = {
  name: 'Tabella clienti',
  parameters: { layout: 'padded' },
  render: () => {
    function ClientsTableDemo() {
      const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'name', dir: 'asc' });
      const [page, setPage] = useState(1);
      const [selected, setSelected] = useState<number | null>(2);
      const perPage = 8;
      const sorted = useMemo(() => {
        const out = [...rows].sort((a, b) => {
          const d =
            sort.key === 'name' ? a.name.localeCompare(b.name, 'it') : sort.key === 'spent' ? a.spent - b.spent : a.lastVisitSort - b.lastVisitSort;
          return sort.dir === 'asc' ? d : -d;
        });
        return out.slice((page - 1) * perPage, page * perPage);
      }, [sort, page]);
      const sortBy = (key: SortKey) =>
        setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));
      const dirOf = (key: SortKey) => (sort.key === key ? sort.dir : false);
      return (
        <div className="max-w-[880px] flex flex-col gap-3">
          <div className={`${tableCardClass} overflow-x-auto`}>
            <table className={tableClass}>
              <thead className={theadClass}>
                <tr>
                  <th className={thClass({ sortable: true })} onClick={() => sortBy('name')}>
                    <span className="inline-flex items-center gap-1">Nome <SortIndicator direction={dirOf('name')} /></span>
                  </th>
                  <th className={thClass()}>Telefono</th>
                  <th className={thClass({ sortable: true })} onClick={() => sortBy('lastVisit')}>
                    <span className="inline-flex items-center gap-1">Ultima visita <SortIndicator direction={dirOf('lastVisit')} /></span>
                  </th>
                  <th className={thClass({ sortable: true, align: 'right' })} onClick={() => sortBy('spent')}>
                    <span className="inline-flex items-center gap-1">Spesa <SortIndicator direction={dirOf('spent')} /></span>
                  </th>
                  <th className={thClass()}>Stato</th>
                </tr>
              </thead>
              <tbody className={tbodyClass}>
                {sorted.map((r) => (
                  <tr key={r.id} tabIndex={0} className={trClass({ selected: selected === r.id })} onClick={() => setSelected(r.id)}>
                    <td className={`${tdClass} ${cellStrongClass}`}>{r.name}</td>
                    <td className={`${tdClass} ${cellNumClass}`}>{r.phone ?? <CellEmpty />}</td>
                    <td className={`${tdClass} ${cellNumClass}`}>{r.lastVisit ?? <CellEmpty />}</td>
                    <td className={`${tdClass} ${cellNumClass} text-right text-[var(--lume-text)]`}>{eur(r.spent)}</td>
                    <td className={tdClass}>
                      <StatusDot tone={r.status.tone}>{r.status.label}</StatusDot>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} onPageChange={setPage} totalItems={rows.length} itemsPerPage={perPage} labelPlural="clienti" />
        </div>
      );
    }
    return <ClientsTableDemo />;
  },
};

export const SortIndicators: Story = {
  name: 'SortIndicator, tutti gli stati',
  render: () => (
    <div className={tableCardClass}>
      <table className={tableClass}>
        <thead className={theadClass}>
          <tr>
            <th className={thClass({ sortable: true })}>
              <span className="inline-flex items-center gap-1">Crescente <SortIndicator direction="asc" /></span>
            </th>
            <th className={thClass({ sortable: true })}>
              <span className="inline-flex items-center gap-1">Decrescente <SortIndicator direction="desc" /></span>
            </th>
            <th className={thClass({ sortable: true })}>
              <span className="inline-flex items-center gap-1">Non ordinata (hover) <SortIndicator direction={false} /></span>
            </th>
          </tr>
        </thead>
      </table>
    </div>
  ),
};

export const EmptyCells: Story = {
  name: 'CellEmpty',
  render: () => (
    <div className={tableCardClass}>
      <table className={tableClass}>
        <thead className={theadClass}>
          <tr>
            <th className={thClass()}>Cliente</th>
            <th className={thClass()}>Email</th>
            <th className={thClass()}>Telefono</th>
          </tr>
        </thead>
        <tbody className={tbodyClass}>
          <tr className={trClass({ interactive: false })}>
            <td className={`${tdClass} ${cellStrongClass}`}>Marco Bianchi</td>
            <td className={tdClass}><CellEmpty /></td>
            <td className={`${tdClass} ${cellNumClass}`}>+39 347 812 4590</td>
          </tr>
          <tr className={trClass({ interactive: false })}>
            <td className={`${tdClass} ${cellStrongClass}`}>Chiara Ricci</td>
            <td className={tdClass}>chiara.ricci@gmail.com</td>
            <td className={tdClass}><CellEmpty /></td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
};

export const EmptyTable: Story = {
  name: 'Tabella vuota',
  parameters: { layout: 'padded' },
  render: () => (
    <div className={`${tableCardClass} max-w-[880px]`}>
      <table className={tableClass}>
        <thead className={theadClass}>
          <tr>
            <th className={thClass()}>Nome</th>
            <th className={thClass()}>Telefono</th>
            <th className={thClass()}>Ultima visita</th>
            <th className={thClass({ align: 'right' })}>Spesa</th>
          </tr>
        </thead>
        <tbody className={tbodyClass}>
          <tr>
            <td colSpan={4} className={tableMessageClass}>Nessun cliente corrisponde alla ricerca</td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
};
