import { useState } from 'react';
import { Check, Copy, Eye, EyeOff } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { Button } from './Button';
import { SwapIcon } from './SwapIcon';

function PasswordToggle() {
  const [visible, setVisible] = useState(false);
  return (
    <Button
      variant="ghost"
      iconOnly
      aria-label={visible ? 'Nascondi password' : 'Mostra password'}
      onClick={() => setVisible((v) => !v)}
    >
      <SwapIcon icon={visible ? EyeOff : Eye} className="size-4" />
    </Button>
  );
}

function CopyButton() {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      onClick={() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      <SwapIcon icon={copied ? Check : Copy} className="size-4" />
      {copied ? 'Copiato' : 'Copia link prenotazione'}
    </Button>
  );
}

const meta: Meta<typeof SwapIcon> = {
  title: 'Azioni/SwapIcon',
  component: SwapIcon,
  args: { icon: Eye, className: 'size-4' },
  argTypes: {
    icon: { control: false },
    className: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'An icon that pops in when it changes, for two-state controls such as show/hide password or copy/copied. The first icon renders still, so a page of toggles does not animate on load. Click the buttons in the stories to see the swap.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof SwapIcon>;

export const Playground: Story = {
  render: (args) => (
    <span className="text-[var(--lume-text)]">
      <SwapIcon {...args} />
    </span>
  ),
};

export const ShowPassword: Story = {
  render: () => <PasswordToggle />,
};

export const CopyLink: Story = {
  render: () => <CopyButton />,
};
