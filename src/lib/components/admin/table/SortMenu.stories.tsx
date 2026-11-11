import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { SortMenu } from './SortMenu';

type SortKey = 'recenti' | 'nome' | 'cognome' | 'spesa' | 'visite';

const options: { value: SortKey; label: string }[] = [
  { value: 'recenti', label: 'Più recenti' },
  { value: 'nome', label: 'Nome (A–Z)' },
  { value: 'cognome', label: 'Cognome (A–Z)' },
  { value: 'spesa', label: 'Spesa totale' },
  { value: 'visite', label: 'Numero di visite' },
];

const meta: Meta<typeof SortMenu<SortKey>> = {
  title: 'Navigazione/SortMenu',
  component: SortMenu<SortKey>,
  args: { options, value: 'recenti' },
  argTypes: {
    onChange: { control: false },
    options: { control: 'object' },
    value: { control: 'select', options: options.map((o) => o.value) },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A secondary button that shows the current sort ("Ordina: Più recenti") and opens a menu with one radio row per option. Use it above card grids and lists that have no sortable column headers.',
      },
    },
  },
  render: (args) => {
    function Sorted() {
      const [value, setValue] = useState(args.value);
      return <SortMenu options={args.options} value={value} onChange={setValue} />;
    }
    return <Sorted key={args.value} />;
  },
};
export default meta;

type Story = StoryObj<typeof SortMenu<SortKey>>;

/** Clicks the first button inside once, so the menu shows open on load. */
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
  return (
    <div ref={ref} className="h-[320px] pt-4">
      {children}
    </div>
  );
}

export const Playground: Story = {};

export const Open: Story = {
  name: 'Aperto',
  decorators: [(Story) => <OpenOnMount><Story /></OpenOnMount>],
};

export const OtherValue: Story = { name: 'Altro ordinamento', args: { value: 'spesa' } };

export const TwoOptions: Story = {
  name: 'Due opzioni',
  args: { options: options.slice(1, 3), value: 'nome' },
  decorators: [(Story) => <OpenOnMount><Story /></OpenOnMount>],
};
