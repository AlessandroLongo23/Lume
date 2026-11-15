import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { FacetedFilter, type FacetedFilterOption } from './FacetedFilter';
import { SeriesDot } from '@/lib/components/shared/ui/StatRow';

const services: FacetedFilterOption[] = [
  { value: 'taglio-donna', label: 'Taglio donna' },
  { value: 'taglio-uomo', label: 'Taglio uomo' },
  { value: 'piega', label: 'Piega' },
  { value: 'colore', label: 'Colore' },
  { value: 'meches', label: 'Meches' },
  { value: 'barba', label: 'Barba' },
];

const operators: FacetedFilterOption[] = [
  { value: 'sara', label: 'Sara', prefix: <SeriesDot color="var(--lume-accent)" /> },
  { value: 'luca', label: 'Luca', prefix: <SeriesDot color="var(--lume-success-fg)" /> },
  { value: 'giada', label: 'Giada', prefix: <SeriesDot color="var(--lume-warning-fg)" /> },
  { value: 'omar', label: 'Omar', prefix: <SeriesDot color="var(--lume-info-fg)" /> },
];

const meta: Meta<typeof FacetedFilter> = {
  title: 'Dati/FacetedFilter',
  component: FacetedFilter,
  args: { label: 'Servizio', options: services, selected: [] },
  argTypes: {
    onChange: { control: false },
    options: { control: 'object' },
    selected: { control: 'object' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A multi-select filter for a table toolbar: a secondary button that shows how many values are picked and opens a checklist, with "Azzera filtri" once something is selected. Options can carry a `prefix` such as an operator colour dot.',
      },
    },
  },
  render: (args) => {
    function Filter() {
      const [selected, setSelected] = useState(args.selected);
      return <FacetedFilter label={args.label} options={args.options} selected={selected} onChange={setSelected} />;
    }
    return <Filter key={JSON.stringify(args.selected)} />;
  },
};
export default meta;

type Story = StoryObj<typeof FacetedFilter>;

/** Opens the panel once on load. */
function OpenOnMount({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => {
      if (done.current) return;
      done.current = true;
      ref.current?.querySelector<HTMLButtonElement>('button[aria-haspopup]')?.click();
    }, 50);
    return () => clearTimeout(t);
  }, []);
  return <div ref={ref} className="h-[380px] pt-4">{children}</div>;
}

export const Playground: Story = {};

export const WithSelection: Story = { name: 'Con selezione', args: { selected: ['colore', 'piega'] } };

export const Open: Story = {
  name: 'Aperto con selezione',
  args: { selected: ['colore', 'piega'] },
  decorators: [(Story) => <OpenOnMount><Story /></OpenOnMount>],
};

export const WithPrefix: Story = {
  name: 'Operatori con colore',
  args: { label: 'Operatore', options: operators, selected: ['sara'] },
  decorators: [(Story) => <OpenOnMount><Story /></OpenOnMount>],
};

export const NoOptions: Story = {
  name: 'Nessuna opzione',
  args: { label: 'Categoria', options: [] },
  decorators: [(Story) => <OpenOnMount><Story /></OpenOnMount>],
};
