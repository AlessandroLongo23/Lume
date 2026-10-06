import { loadFont } from '@remotion/google-fonts/Geist';
import { Easing } from 'remotion';

const { fontFamily } = loadFont('normal', { weights: ['400', '500', '600'], subsets: ['latin'] });

// Values copied from the palette in DESIGN.md. The app's `--lume-*` CSS
// variables are not reachable from the Remotion bundle.
export const theme = {
  fontFamily,
  indigo: 'oklch(0.620 0.190 275)',
  paper: 'oklch(0.985 0.002 265)',
  ink: 'oklch(0.106 0.004 265)',
  inkSecondary: 'oklch(0.421 0.011 265)',
  shell: 'oklch(0.148 0.007 265)',
  surface: 'oklch(0.192 0.008 265)',
  border: 'oklch(0.295 0.010 265)',
  text: 'oklch(0.965 0.004 265)',
  textSecondary: 'oklch(0.780 0.010 265)',
  textMuted: 'oklch(0.605 0.012 265)',
};

// DESIGN.md allows two curves: quartic ease-out and ease-in-out. No springs.
export const easeOut = Easing.out(Easing.poly(4));
export const easeInOut = Easing.inOut(Easing.cubic);
