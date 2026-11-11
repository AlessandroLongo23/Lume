import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { Select } from './Select';
import { Field } from './Field';

type Service = { id: string; name: string; category: string; price: string; minutes: number };

const services: Service[] = [
  { id: 's1', name: 'Taglio donna', category: 'Taglio', price: '35,00 €', minutes: 45 },
  { id: 's2', name: 'Taglio uomo', category: 'Taglio', price: '22,00 €', minutes: 30 },
  { id: 's3', name: 'Taglio bambino', category: 'Taglio', price: '15,00 €', minutes: 20 },
  { id: 's4', name: 'Piega', category: 'Styling', price: '20,00 €', minutes: 30 },
  { id: 's5', name: 'Raccolto sposa', category: 'Styling', price: '80,00 €', minutes: 90 },
  { id: 's6', name: 'Colore', category: 'Colore', price: '45,00 €', minutes: 60 },
  { id: 's7', name: 'Colpi di sole', category: 'Colore', price: '70,00 €', minutes: 90 },
  { id: 's8', name: 'Balayage', category: 'Colore', price: '110,00 €', minutes: 120 },
  { id: 's9', name: 'Barba', category: 'Barberia', price: '12,00 €', minutes: 20 },
];

const operators = [
  { id: 'o1', name: 'Sara' },
  { id: 'o2', name: 'Luca' },
  { id: 'o3', name: 'Martina' },
  { id: 'o4', name: 'Davide' },
];

/** Clicks the trigger once after mount, so the story shows the list open. */
function OpenOnMount({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => ref.current?.querySelector<HTMLElement>('[role="combobox"]')?.click(), 80);
    return () => clearTimeout(t);
  }, []);
  return <div ref={ref}>{children}</div>;
}

const meta: Meta<typeof Select> = {
  title: 'Moduli/Select',
  component: Select,
  args: {
    options: operators,
    labelKey: 'name',
    valueKey: 'id',
    placeholder: 'Scegli un operatore',
    searchable: false,
    isNullable: false,
    disabled: false,
    invalid: false,
    size: 'md',
  },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    placeholder: { control: 'text' },
    searchPlaceholder: { control: 'text' },
    options: { control: false },
    value: { control: false },
    onChange: { control: false },
    labelKey: { control: false },
    renderOption: { control: false },
    renderValue: { control: false },
    groupBy: { control: false },
    createAction: { control: false },
    onCreateFromSearch: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The one picker in Lume: a field-surface trigger opening a floating list with optional search, groups, custom rows and a "create new" action. Build any dropdown from this one; wrap it in `Field` for a label and error.',
      },
    },
  },
  decorators: [(Story) => <div className="w-[320px] min-h-[340px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof Select>;

export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<string | null>('o1');
    return <Select {...args} value={value} onChange={setValue} ariaLabel="Operatore" />;
  },
};

export const Open: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>('o2');
    return (
      <OpenOnMount>
        <Select value={value} onChange={setValue} options={operators} labelKey="name" valueKey="id" searchable={false} ariaLabel="Operatore" />
      </OpenOnMount>
    );
  },
};

export const Searchable: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>(null);
    return (
      <OpenOnMount>
        <Select value={value} onChange={setValue} options={services} labelKey="name" valueKey="id" placeholder="Scegli un servizio" searchPlaceholder="Cerca servizio…" ariaLabel="Servizio" />
      </OpenOnMount>
    );
  },
};

export const Grouped: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>('s6');
    return (
      <OpenOnMount>
        <Select
          value={value}
          onChange={setValue}
          options={services}
          labelKey="name"
          valueKey="id"
          groupBy={(s?: Service) => s?.category}
          maxHeight="max-h-64"
          ariaLabel="Servizio"
        />
      </OpenOnMount>
    );
  },
};

export const CustomRows: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>('s1');
    return (
      <OpenOnMount>
        <Select
          value={value}
          onChange={setValue}
          options={services}
          labelKey="name"
          valueKey="id"
          ariaLabel="Servizio"
          renderOption={(s: Service) => (
            <span className="flex w-full items-baseline justify-between gap-3">
              <span className="truncate">{s.name}</span>
              <span className="shrink-0 tabular-nums text-xs text-[var(--lume-text-muted)]">{s.minutes}′ · {s.price}</span>
            </span>
          )}
          renderValue={(s: Service) => <span>{s.name} <span className="text-[var(--lume-text-muted)]">· {s.price}</span></span>}
        />
      </OpenOnMount>
    );
  },
};

export const WithCreateAction: Story = {
  render: function Render() {
    const [items, setItems] = useState(operators);
    const [value, setValue] = useState<string | null>(null);
    return (
      <OpenOnMount>
        <Select
          value={value}
          onChange={setValue}
          options={items}
          labelKey="name"
          valueKey="id"
          placeholder="Scegli un operatore"
          ariaLabel="Operatore"
          createAction={{
            label: 'Nuovo',
            onClick: () => {
              const id = `o${items.length + 1}`;
              setItems([...items, { id, name: `Operatore ${items.length + 1}` }]);
              setValue(id);
            },
          }}
          onCreateFromSearch={(name) => {
            const id = `o${items.length + 1}`;
            setItems([...items, { id, name }]);
            setValue(id);
          }}
        />
      </OpenOnMount>
    );
  },
};

export const Nullable: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>('o3');
    return <Select value={value} onChange={setValue} options={operators} labelKey="name" valueKey="id" isNullable searchable={false} placeholder="Qualsiasi operatore" ariaLabel="Operatore" />;
  },
};

export const WithError: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>(null);
    return (
      <Field label="Operatore" required error={value ? undefined : 'Scegli chi esegue il servizio'}>
        {({ id, invalid }) => (
          <Select id={id} invalid={invalid} value={value} onChange={setValue} options={operators} labelKey="name" valueKey="id" searchable={false} placeholder="Scegli un operatore" />
        )}
      </Field>
    );
  },
};

export const Disabled: Story = {
  render: () => <Select value="o1" onChange={() => {}} options={operators} labelKey="name" valueKey="id" disabled ariaLabel="Operatore" />,
};
