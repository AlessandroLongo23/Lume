// Shape of video/public/<slug>/timeline.json, written by record.mjs. All
// coordinates are CSS pixels of the recorded viewport; all times are
// milliseconds from the first frame of raw.mp4.

export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point {
  width: number;
  height: number;
}

export interface TimelineStep {
  i: number;
  mode: 'narrate' | 'action';
  title: string;
  /** The highlighted element. */
  rect: Rect;
  /** The tour card, as the app rendered it; null when it was off screen. */
  card: Rect | null;
  t0: number;
  tAction: number | null;
  t1: number;
}

export interface Timeline {
  slug: string;
  title: string;
  subtitle: string;
  fps: number;
  viewport: { width: number; height: number };
  cursorStart: Point;
  steps: TimelineStep[];
  moves: { t0: number; t1: number; from: Point; to: Point }[];
  clicks: ({ t: number } & Point)[];
  typing: { t0: number; t1: number; text: string }[];
  durationMs: number;
}
