import { easeInOut } from './theme';
import type { Timeline, TimelineStep } from './timeline';

export interface Camera {
  /** Point of the recorded viewport shown at the centre of the frame. */
  x: number;
  y: number;
  scale: number;
}

const MAX_ZOOM = 1.5;
// Zoom for a step whose target is a whole page: enough to read the card.
const WIDE_ZOOM = 1.25;
const TRANSITION_MS = 750;
/** Viewport pixels of air kept around whatever the camera frames. */
const PADDING = 48;

function full(tl: Timeline): Camera {
  return { x: tl.viewport.width / 2, y: tl.viewport.height / 2, scale: 1 };
}

/**
 * Frames a step's target together with the tour card that describes it, as
 * tightly as fits. A page-sized target cannot be framed that way, so the camera
 * moves in on the card alone.
 */
export function focus(tl: Timeline, step: TimelineStep): Camera {
  const { width, height } = tl.viewport;
  const wide = step.rect.width > width * 0.5 || step.rect.height > height * 0.5;
  if (wide && !step.card) return full(tl);
  const boxes = [wide ? null : step.rect, step.card].filter((b) => b !== null);
  const x0 = Math.min(...boxes.map((b) => b.x));
  const y0 = Math.min(...boxes.map((b) => b.y));
  const x1 = Math.max(...boxes.map((b) => b.x + b.width));
  const y1 = Math.max(...boxes.map((b) => b.y + b.height));
  const fit = Math.min(width / (x1 - x0 + PADDING * 2), height / (y1 - y0 + PADDING * 2));
  const scale = Math.max(1, Math.min(wide ? WIDE_ZOOM : MAX_ZOOM, fit));
  const vw = width / scale;
  const vh = height / scale;
  return {
    x: Math.min(width - vw / 2, Math.max(vw / 2, (x0 + x1) / 2)),
    y: Math.min(height - vh / 2, Math.max(vh / 2, (y0 + y1) / 2)),
    scale,
  };
}

function keyframes(tl: Timeline): { t: number; cam: Camera }[] {
  const keys = [{ t: -TRANSITION_MS, cam: full(tl) }];
  for (const step of tl.steps) {
    keys.push({ t: step.t0, cam: focus(tl, step) });
    // A click that only triggers something (navigation, a modal, a save) pulls
    // back right away so the result is visible. Typing stays zoomed in.
    const typed = tl.typing.some((y) => y.t0 >= step.t0 && y.t0 <= step.t1);
    if (step.tAction !== null && !typed) keys.push({ t: step.tAction + 350, cam: full(tl) });
  }
  return keys;
}

export function cameraAt(tl: Timeline, t: number): Camera {
  const keys = keyframes(tl);
  const i = Math.max(1, keys.findLastIndex((key) => key.t <= t));
  const from = keys[i - 1].cam;
  const to = keys[i].cam;
  const p = easeInOut(Math.min(1, Math.max(0, (t - keys[i].t) / TRANSITION_MS)));
  return {
    x: from.x + (to.x - from.x) * p,
    y: from.y + (to.y - from.y) * p,
    scale: from.scale + (to.scale - from.scale) * p,
  };
}
