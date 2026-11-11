import { useState } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { RichTextEditor } from './RichTextEditor';

const meta: Meta<typeof RichTextEditor> = {
  title: 'Moduli/RichTextEditor',
  component: RichTextEditor,
  args: { placeholder: 'Scrivi il messaggio…', disabled: false, minHeight: 120 },
  argTypes: {
    minHeight: { control: 'number' },
    value: { control: false },
    onChange: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A small rich text editor (bold, italic, strikethrough, lists, quote, link) built on Tiptap, for email templates and long notes. `onChange` returns both the HTML and the plain text.',
      },
    },
  },
  decorators: [(Story) => <div className="w-[520px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof RichTextEditor>;

export const Playground: Story = {
  render: function Render(args) {
    const [html, setHtml] = useState('');
    return <RichTextEditor {...args} value={html} onChange={(h) => setHtml(h)} />;
  },
};

const reminder =
  '<p>Ciao <strong>Giulia</strong>,</p><p>ti ricordiamo l’appuntamento di <em>mercoledì 4 novembre</em> alle 15:30 con Sara:</p><ul><li>Taglio donna</li><li>Piega</li></ul><p>Per spostarlo rispondi a questa email o chiama il salone.</p>';

export const WithContent: Story = {
  render: function Render() {
    const [html, setHtml] = useState(reminder);
    const [text, setText] = useState('');
    return (
      <div className="flex flex-col gap-2">
        <RichTextEditor value={html} onChange={(h, t) => { setHtml(h); setText(t); }} />
        <p className="text-xs text-[var(--lume-text-muted)]">{text ? `${text.length} caratteri` : 'Modifica il testo per vedere il conteggio.'}</p>
      </div>
    );
  },
};

export const WithQuoteAndLink: Story = {
  render: function Render() {
    const [html, setHtml] = useState(
      '<blockquote><p>Il miglior colore della mia vita, grazie Martina!</p></blockquote><p>Lascia anche tu una recensione su <a href="https://lume.it/salone-giulia">lume.it/salone-giulia</a>.</p>',
    );
    return <RichTextEditor value={html} onChange={(h) => setHtml(h)} />;
  },
};

export const Disabled: Story = {
  args: { disabled: true, value: reminder, onChange: () => {} },
};

export const Tall: Story = {
  args: { minHeight: 240 },
  render: function Render(args) {
    const [html, setHtml] = useState('');
    return <RichTextEditor {...args} value={html} onChange={(h) => setHtml(h)} placeholder="Scrivi le note della consulenza colore…" />;
  },
};
