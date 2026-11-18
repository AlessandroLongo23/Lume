export interface LaneItem {
  key: string;
  start: number; // ms
  end: number; // ms
}

export interface LanePlacement {
  /** Zero-based lane the item sits in. */
  lane: number;
  /** Lanes in the item's overlap cluster: the item is 1/laneCount of the column wide. */
  laneCount: number;
}

/**
 * Places items that overlap in time side by side, the way a calendar does when
 * one operator is double booked. Items are grouped into clusters of transitively
 * overlapping items; inside a cluster each item takes the first lane that is free
 * at its start, and every item in the cluster shares the cluster's lane count.
 * Items that overlap nothing get { lane: 0, laneCount: 1 }, i.e. full width.
 */
export function computeLanes(items: LaneItem[]): Map<string, LanePlacement> {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const out = new Map<string, LanePlacement>();

  let cluster: { key: string; lane: number }[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    for (const { key, lane } of cluster) out.set(key, { lane, laneCount: laneEnds.length });
    cluster = [];
    laneEnds = [];
  };

  for (const item of sorted) {
    if (item.start >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.end);
    } else {
      laneEnds[lane] = item.end;
    }
    cluster.push({ key: item.key, lane });
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  flush();

  return out;
}

/** Horizontal position of a fiche block inside its column. The block leaves room
 *  for the double-booking strip, `--cal-gutter`: 0 at rest, 1rem (animated) while
 *  the pointer is in the column (see components.css and TimeGrid). */
export function laneStyle({ lane, laneCount }: LanePlacement): { left: string; width: string } {
  const usable = `(100% - var(--cal-gutter, 0rem))`;
  return {
    left: `calc(${usable} * ${lane} / ${laneCount} + 0.125rem)`,
    width: `calc(${usable} / ${laneCount} - 0.25rem)`,
  };
}
