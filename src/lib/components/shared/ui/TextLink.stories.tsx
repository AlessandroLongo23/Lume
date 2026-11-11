import type { Meta, StoryObj } from '@docs/csf';
import { TextLink, TextButton } from './TextLink';

const meta: Meta<typeof TextLink> = {
  title: 'Azioni/TextLink',
  component: TextLink,
  args: { href: '#', children: 'Apri la scheda cliente', quiet: false },
  argTypes: {
    quiet: { control: 'boolean' },
    href: { control: 'text' },
    children: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'An inline link inside running text: underlined, in the current text colour. `quiet` hides the underline until hover, for links in table cells and lists. `TextButton` gives the same look to an action that is not a navigation.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof TextLink>;

export const Playground: Story = {};

export const InText: Story = {
  render: (args) => (
    <p className="max-w-sm text-sm text-[var(--lume-text-secondary)]">
      Giulia Rossi ha un appuntamento domani alle 10:30. <TextLink {...args}>Apri il calendario</TextLink> per
      spostarlo.
    </p>
  ),
};

export const Quiet: Story = {
  render: (args) => (
    <ul className="flex flex-col gap-1.5 text-sm">
      <li><TextLink {...args} quiet>Giulia Rossi</TextLink></li>
      <li><TextLink {...args} quiet>Marco Bianchi</TextLink></li>
      <li><TextLink {...args} quiet>Chiara Esposito</TextLink></li>
    </ul>
  ),
};

export const AsTextButton: Story = {
  render: () => (
    <p className="max-w-sm text-sm text-[var(--lume-text-secondary)]">
      Hai modificato il prezzo di Taglio donna. <TextButton onClick={() => {}}>Annulla modifica</TextButton>
    </p>
  ),
};

export const TextButtonDisabled: Story = {
  render: () => (
    <TextButton disabled className="disabled:opacity-50 disabled:cursor-not-allowed">
      Personalizza
    </TextButton>
  ),
};
