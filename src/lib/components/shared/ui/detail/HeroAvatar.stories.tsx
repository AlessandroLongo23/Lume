import { Gift, Package, Scissors, Tag, UserRound } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { HeroAvatar, HeroIconTile } from './HeroAvatar';

// A stand-in portrait, inline so the canvas needs no network.
const photo =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#c9b8a6"/><circle cx="48" cy="38" r="18" fill="#8a6e58"/><rect x="18" y="62" width="60" height="40" rx="30" fill="#6b5546"/></svg>',
  );

const meta: Meta<typeof HeroAvatar> = {
  title: 'Layout/HeroAvatar',
  component: HeroAvatar,
  args: { initials: 'GR', photoUrl: null },
  argTypes: { photoUrl: { control: 'text' } },
  parameters: {
    docs: {
      description: {
        component:
          'The 48px identity mark at the start of a `DetailHero`. `HeroAvatar` is for people (photo, else initials); `HeroIconTile` is for things (a product, a service, an order): the same neutral fill with the icon in the secondary ink, no tint.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof HeroAvatar>;

export const Playground: Story = {};

export const WithPhoto: Story = { name: 'Con foto', args: { photoUrl: photo } };

export const NoInitials: Story = { name: 'Senza iniziali', args: { initials: '' } };

export const People: Story = {
  name: 'Clienti e operatori',
  render: () => (
    <div className="flex items-center gap-3">
      <HeroAvatar initials="GR" />
      <HeroAvatar initials="MB" />
      <HeroAvatar initials="S" />
      <HeroAvatar initials="LV" photoUrl={photo} />
    </div>
  ),
};

export const IconTiles: Story = {
  name: 'HeroIconTile',
  render: () => (
    <div className="flex items-center gap-3">
      <HeroIconTile icon={UserRound} />
      <HeroIconTile icon={Scissors} />
      <HeroIconTile icon={Package} />
      <HeroIconTile icon={Tag} />
      <HeroIconTile icon={Gift} />
    </div>
  ),
};
