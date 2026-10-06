import { interpolate } from 'remotion';
import { easeInOut, easeOut, theme } from './theme';
import type { Point, Timeline } from './timeline';

function positionAt(tl: Timeline, t: number): Point {
  let pos = tl.cursorStart;
  for (const move of tl.moves) {
    if (t < move.t0) break;
    // Same curve record.mjs used for the real mouse, so hover states line up.
    const p = easeInOut(Math.min(1, (t - move.t0) / (move.t1 - move.t0)));
    pos = { x: move.from.x + (move.to.x - move.from.x) * p, y: move.from.y + (move.to.y - move.from.y) * p };
  }
  return pos;
}

/** Drawn cursor plus click ripples. `k` converts viewport pixels to frame pixels. */
export function Cursor({ timeline, t, k }: { timeline: Timeline; t: number; k: number }) {
  const pos = positionAt(timeline, t);
  const click = timeline.clicks.findLast((c) => c.t <= t);
  const sinceClick = click ? t - click.t : Infinity;
  const press = interpolate(sinceClick, [0, 90, 260], [1, 0.86, 1], { extrapolateRight: 'clamp' });

  return (
    <>
      {click && sinceClick < 520 ? (
        <div
          style={{
            position: 'absolute',
            left: click.x * k,
            top: click.y * k,
            width: 0,
            height: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 64,
              height: 64,
              left: -32,
              top: -32,
              borderRadius: '50%',
              border: `3px solid ${theme.indigo}`,
              transform: `scale(${interpolate(sinceClick, [0, 520], [0.25, 1], { easing: easeOut })})`,
              opacity: interpolate(sinceClick, [0, 520], [0.9, 0]),
            }}
          />
        </div>
      ) : null}
      <svg
        width={36}
        height={36}
        viewBox="0 0 24 24"
        style={{
          position: 'absolute',
          left: pos.x * k - 6,
          top: pos.y * k - 4.5,
          transformOrigin: '6px 4.5px',
          transform: `scale(${press})`,
          filter: 'drop-shadow(0 2px 3px rgb(0 0 0 / 0.3))',
        }}
      >
        <path
          d="M4 3l14.5 8.2-6.4 1.7 3.7 6.6-2.6 1.5-3.8-6.6L4.9 19z"
          fill={theme.ink}
          stroke="#fff"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
}
