// Runs in the canvas before every story: the app's CSS, its providers and
// the light/dark switch.
import './preview.css';
import type { ReactNode } from 'react';
import { UiProviders } from '@/lib/components/shared/ui/UiProviders';
import { MessagePopupContainer } from '@/lib/components/shared/ui/messagePopup/MessagePopupContainer';

export const parameters = { layout: 'centered' };

function Providers({ children }: { children: ReactNode }) {
  return (
    <UiProviders>
      {children}
      <MessagePopupContainer />
    </UiProviders>
  );
}

export const decorators = [
  (Story: () => ReactNode) => (
    <Providers>
      <Story />
    </Providers>
  ),
];

// The app toggles `.dark` on <html> (ThemeProvider) and mirrors it in
// data-theme for view transitions.
export function applyGlobals(globals: { theme?: string }, { document }: { document: Document }) {
  const dark = globals.theme === 'dark';
  const html = document.documentElement;
  html.classList.toggle('dark', dark);
  html.dataset.theme = dark ? 'dark' : 'light';
  html.style.colorScheme = dark ? 'dark' : 'light';
  html.lang = 'it';
  // edl-docs 0.2.0 reads the page background as rgb() numbers to paint the
  // canvas rulers; Lume's oklch() background reads as pure blue. Hand it the
  // same colour in sRGB.
  html.style.removeProperty('background-color');
  const rgb = toRgb(getComputedStyle(html).getPropertyValue('--lume-bg').trim(), document);
  if (rgb) html.style.backgroundColor = rgb;
}

function toRgb(color: string, document: Document): string | null {
  if (!color) return null;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}
