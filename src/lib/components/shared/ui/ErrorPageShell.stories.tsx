import { RotateCcw } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { ErrorPageShell } from './ErrorPageShell';

const meta: Meta<typeof ErrorPageShell> = {
  title: 'Layout/ErrorPageShell',
  component: ErrorPageShell,
  args: {
    code: '404',
    title: 'Pagina non trovata',
    description: 'La pagina che stai cercando non esiste o è stata spostata.',
    destinationHref: '/admin/calendario',
    destinationLabel: 'il calendario',
  },
  argTypes: {
    code: { control: 'text' },
    title: { control: 'text' },
    description: { control: 'text' },
    destinationHref: { control: 'text' },
    destinationLabel: { control: 'text' },
    extraAction: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The full page behind 404, 500 and access errors: the logo, an error code, a title and a 5-second countdown that redirects to a safe destination unless the user chooses to stay. In the canvas the redirect goes to the stubbed router and does nothing.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ErrorPageShell>;

export const Playground: Story = {};

export const ServerError: Story = {
  args: {
    code: '500',
    title: 'Qualcosa è andato storto',
    description: 'Non siamo riusciti a caricare la pagina. Riprova tra qualche secondo.',
    extraAction: { label: 'Riprova', icon: RotateCcw, onClick: () => {} },
  },
};
