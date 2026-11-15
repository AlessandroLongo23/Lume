import { useEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import type { ExportColumn } from '@/lib/utils/tableExport';
import { ExportMenu } from './ExportMenu';

interface ClientRow {
  nome: string;
  telefono: string;
  visite: number;
  speso: number;
}

const ROWS: ClientRow[] = [
  { nome: 'Giulia Rossi', telefono: '+39 333 123 4567', visite: 14, speso: 612.5 },
  { nome: 'Marco Bianchi', telefono: '+39 347 765 4321', visite: 6, speso: 168 },
  { nome: 'Francesca Romano', telefono: '+39 320 555 0199', visite: 2, speso: 75 },
];

const COLUMNS: ExportColumn<ClientRow>[] = [
  { label: 'Nome', accessor: (r) => r.nome },
  { label: 'Telefono', accessor: (r) => r.telefono },
  { label: 'Visite', accessor: (r) => r.visite },
  { label: 'Speso (€)', accessor: (r) => r.speso },
];

// ExportMenu is generic; pin it to the story's row type for Controls.
const ClientExportMenu = ExportMenu<ClientRow>;

const meta: Meta<typeof ClientExportMenu> = {
  title: 'Sovrapposizioni/ExportMenu',
  component: ClientExportMenu,
  args: { rows: ROWS, columns: COLUMNS, baseName: 'clienti', pdfTitle: 'Elenco clienti' },
  argTypes: {
    rows: { control: false },
    columns: { control: false },
    baseName: { control: 'text' },
    pdfTitle: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The "Esporta" button of a data table. It opens a menu of formats (Excel, CSV, printable PDF) and exports the rows it is given through the column descriptors, which return plain values. The trigger disables itself when there are no rows.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ClientExportMenu>;

export const Playground: Story = {};

/** Opens on load (the story clicks the trigger once mounted). */
export const Open: Story = {
  render: function Render(args) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const id = setTimeout(() => ref.current?.querySelector('button')?.click(), 50);
      return () => clearTimeout(id);
    }, []);
    return (
      <div ref={ref} className="h-[300px] w-[320px] flex items-start justify-end pt-4">
        <ClientExportMenu {...args} />
      </div>
    );
  },
};

export const NoRows: Story = { args: { rows: [] } };
