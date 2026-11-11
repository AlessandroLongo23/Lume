import { useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { ChevronDown, Scissors } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { useAnchoredPopover } from '@/lib/hooks/useAnchoredPopover';
import { Button } from './Button';
import { Portal } from './Portal';
import { FloatingPanel } from './FloatingPanel';
import { ListBox, ListRow } from './list/ListBox';

const meta: Meta<typeof FloatingPanel> = {
  title: 'Sovrapposizioni/FloatingPanel',
  component: FloatingPanel,
  args: { side: 'bottom', layer: 'popover' },
  argTypes: {
    side: { control: 'radio', options: ['top', 'bottom'] },
    layer: { control: 'radio', options: ['dropdown', 'popover'] },
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The surface of everything that floats over the page: menus, select lists, pickers, popovers. One look (raised fill, float shadow, no border) and one motion (fade plus a 4px drift). Position it with `useAnchoredPopover`, render it through `Portal` and inside `AnimatePresence` so it can animate out.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof FloatingPanel>;

const OPERATORS = ['Sara', 'Luca', 'Chiara', 'Davide'];

/** The panel on its own, inline, as it looks once open. */
export const Playground: Story = {
  render: (args) => (
    <FloatingPanel {...args} className="w-[240px] relative">
      <ListBox role="listbox" aria-label="Operatore">
        {OPERATORS.map((o, i) => (
          <ListRow key={o} selected={i === 0}>{o}</ListRow>
        ))}
      </ListBox>
    </FloatingPanel>
  ),
};

export const TextContent: Story = {
  render: (args) => (
    <FloatingPanel {...args} className="w-[280px] relative p-4 flex flex-col gap-1">
      <p className="text-sm font-medium text-[var(--lume-text)]">Giulia Rossi</p>
      <p className="text-sm text-[var(--lume-text-secondary)]">Taglio donna e piega con Sara</p>
      <p className="text-xs text-[var(--lume-text-muted)]">Giovedì 30 ottobre, 10:30 · 55,00 €</p>
    </FloatingPanel>
  ),
};

/** The full recipe: trigger, `useAnchoredPopover`, `Portal`, `AnimatePresence`. Click to open; Escape or an outside click closes it. */
export const WithTrigger: Story = {
  render: function Render(args) {
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [value, setValue] = useState('Sara');
    const { open, toggle, hide, position, panelRef, side } = useAnchoredPopover(triggerRef, { panelMaxHeight: 200 });
    return (
      <>
        <Button ref={triggerRef} trailingIcon={ChevronDown} onClick={toggle} aria-expanded={open} aria-haspopup="listbox">
          {value}
        </Button>
        <Portal>
          <AnimatePresence>
            {open && position && (
              <FloatingPanel
                {...args}
                ref={panelRef}
                side={side}
                style={{ position: 'fixed', left: position.left, top: position.top, bottom: position.bottom, width: 220 }}
              >
                <ListBox role="listbox" aria-label="Operatore">
                  {OPERATORS.map((o) => (
                    <ListRow key={o} icon={Scissors} selected={value === o} onClick={() => { setValue(o); hide(); }}>
                      {o}
                    </ListRow>
                  ))}
                </ListBox>
              </FloatingPanel>
            )}
          </AnimatePresence>
        </Portal>
      </>
    );
  },
};
