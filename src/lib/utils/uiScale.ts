/**
 * "Dimensione interfaccia": a per-device scale for the whole UI.
 *
 * The chosen value lives in localStorage (not in the user's preferences) because
 * the problem it solves belongs to the screen: the same owner may want "Compatta"
 * on the salon's old 1366×768 PC and "Normale" on a 1080p laptop at home.
 *
 * It works by setting `data-ui-scale` on <html>; globals.css maps each value to
 * a root font-size, and since nearly every size in the app is in rem, the
 * whole interface scales with it. No attribute means "auto". The inline script
 * in app/layout.tsx applies the stored value before first paint.
 */

export type UiScale = 'auto' | 'large' | 'normal' | 'compact' | 'extra-compact';

export const UI_SCALE_STORAGE_KEY = 'lume-ui-scale';
const CHANGE_EVENT = 'lume-ui-scale-change';

const UI_SCALES: readonly UiScale[] = ['auto', 'large', 'normal', 'compact', 'extra-compact'];

function isUiScale(value: string | null): value is UiScale {
  return value !== null && (UI_SCALES as readonly string[]).includes(value);
}

export function readUiScale(): UiScale {
  try {
    const stored = localStorage.getItem(UI_SCALE_STORAGE_KEY);
    return isUiScale(stored) ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

export function applyUiScale(scale: UiScale) {
  const root = document.documentElement;
  if (scale === 'auto') root.removeAttribute('data-ui-scale');
  else root.setAttribute('data-ui-scale', scale);
  try {
    if (scale === 'auto') localStorage.removeItem(UI_SCALE_STORAGE_KEY);
    else localStorage.setItem(UI_SCALE_STORAGE_KEY, scale);
  } catch {
    // Storage blocked (private mode): the choice still applies to this tab.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** For useSyncExternalStore: fires whenever applyUiScale runs. */
export function subscribeUiScale(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

/** Inline in <head>, so a stored scale is applied before the first paint. */
export const UI_SCALE_BOOT_SCRIPT = `try{var s=localStorage.getItem('${UI_SCALE_STORAGE_KEY}');if(s)document.documentElement.setAttribute('data-ui-scale',s)}catch(e){}`;

/** Convert rem to px using the live root font-size (which the UI scale changes). */
export function remToPx(rem: number): number {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}
