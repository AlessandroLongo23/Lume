import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { ComuneAutocomplete, type ComuneSelection } from './ComuneAutocomplete';

const bologna: ComuneSelection = { comune_code: '037006', city: 'Bologna', province: 'BO', region: 'Emilia-Romagna' };

/** Types into the input once after mount, so the story shows the suggestions. */
function TypeOnMount({ text, children }: { text: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const input = ref.current?.querySelector('input');
      if (!input) return;
      input.focus();
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, text);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, 150);
    return () => clearTimeout(t);
  }, [text]);
  return <div ref={ref}>{children}</div>;
}

const meta: Meta<typeof ComuneAutocomplete> = {
  title: 'Moduli/ComuneAutocomplete',
  component: ComuneAutocomplete,
  args: { label: 'Comune' },
  argTypes: {
    label: { control: 'text' },
    value: { control: false },
    onChange: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Pick an Italian comune by typing its name; the province and region come with it. The list of comuni is bundled (`@/lib/data/comuni.json`, loaded on first use), so it works offline.',
      },
    },
  },
  decorators: [(Story) => <div className="w-[360px] min-h-[360px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof ComuneAutocomplete>;

export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<ComuneSelection | null>(null);
    return <ComuneAutocomplete {...args} value={value} onChange={setValue} />;
  },
};

export const Selected: Story = {
  render: function Render() {
    const [value, setValue] = useState<ComuneSelection | null>(bologna);
    return <ComuneAutocomplete label="Comune di residenza" value={value} onChange={setValue} />;
  },
};

export const Suggestions: Story = {
  render: function Render() {
    const [value, setValue] = useState<ComuneSelection | null>(null);
    return (
      <TypeOnMount text="San Lazz">
        <ComuneAutocomplete label="Comune" value={value} onChange={setValue} />
      </TypeOnMount>
    );
  },
};

export const NoMatch: Story = {
  render: function Render() {
    const [value, setValue] = useState<ComuneSelection | null>(null);
    return (
      <TypeOnMount text="Parigi">
        <ComuneAutocomplete label="Comune" value={value} onChange={setValue} />
      </TypeOnMount>
    );
  },
};
