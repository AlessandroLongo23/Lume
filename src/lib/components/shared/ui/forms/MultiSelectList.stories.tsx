import { useState } from 'react';
import { Scissors, UserRound } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { MultiSelectList } from './MultiSelectList';

type Service = { id: string; name: string; price: string; minutes: number };

const services: Service[] = [
  { id: 's1', name: 'Taglio donna', price: '35,00 €', minutes: 45 },
  { id: 's2', name: 'Taglio uomo', price: '22,00 €', minutes: 30 },
  { id: 's3', name: 'Piega', price: '20,00 €', minutes: 30 },
  { id: 's4', name: 'Colore', price: '45,00 €', minutes: 60 },
  { id: 's5', name: 'Colpi di sole', price: '70,00 €', minutes: 90 },
  { id: 's6', name: 'Balayage', price: '110,00 €', minutes: 120 },
  { id: 's7', name: 'Trattamento ristrutturante', price: '25,00 €', minutes: 20 },
  { id: 's8', name: 'Barba', price: '12,00 €', minutes: 20 },
  { id: 's9', name: 'Shampoo', price: '5,00 €', minutes: 10 },
  { id: 's10', name: 'Raccolto sposa', price: '80,00 €', minutes: 90 },
];

const operators = [
  { id: 'o1', name: 'Sara', role: 'Titolare' },
  { id: 'o2', name: 'Luca', role: 'Barbiere' },
  { id: 'o3', name: 'Martina', role: 'Colorista' },
];

const meta: Meta<typeof MultiSelectList<Service>> = {
  title: 'Moduli/MultiSelectList',
  component: MultiSelectList,
  args: { ariaLabel: 'Servizi', searchPlaceholder: 'Cerca servizio…', emptyText: 'Nessun servizio trovato' },
  argTypes: {
    items: { control: false },
    selectedIds: { control: false },
    onChange: { control: false },
    getId: { control: false },
    getLabel: { control: false },
    icon: { control: false },
    renderTrailing: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Choose several items from a list inline in a form: a search box over a scrolling card of rows that toggle with a check. Use it for "which services does this operator do" and similar many-to-many choices.',
      },
    },
  },
  decorators: [(Story) => <div className="w-[360px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof MultiSelectList<Service>>;

export const Playground: Story = {
  render: function Render(args) {
    const [ids, setIds] = useState<string[]>(['s1', 's3']);
    return (
      <MultiSelectList
        {...args}
        items={services}
        getId={(s) => s.id}
        getLabel={(s) => s.name}
        selectedIds={ids}
        onChange={setIds}
        icon={Scissors}
        renderTrailing={(s) => <span className="tabular-nums text-xs text-[var(--lume-text-muted)]">{s.price}</span>}
      />
    );
  },
};

export const ShortList: Story = {
  render: function Render() {
    const [ids, setIds] = useState<string[]>(['o1']);
    return (
      <MultiSelectList
        items={operators}
        getId={(o) => o.id}
        getLabel={(o) => o.name}
        selectedIds={ids}
        onChange={setIds}
        ariaLabel="Operatori"
        icon={UserRound}
      />
    );
  },
};

export const Empty: Story = {
  render: function Render() {
    const [ids, setIds] = useState<string[]>([]);
    return (
      <MultiSelectList
        items={[] as Service[]}
        getId={(s) => s.id}
        getLabel={(s) => s.name}
        selectedIds={ids}
        onChange={setIds}
        ariaLabel="Servizi"
        emptyText="Nessun servizio nel listino"
      />
    );
  },
};
