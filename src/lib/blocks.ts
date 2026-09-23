import type { CalEvent } from "./timeblocks";

const QUARTER = 15 * 60_000;

/**
 * EPFL runs on the academic quarter: a session listed at 13:15 really occupies the hour from 13:00,
 * the first fifteen minutes being the walk between rooms. Zurich's UTC offset is always a whole
 * number of hours, so checking UTC minutes is the same as checking local ones.
 */
export function snapStart(ms: number): number {
  const d = new Date(ms);
  return d.getUTCMinutes() === 15 && d.getUTCSeconds() === 0 ? ms - QUARTER : ms;
}

export type Block = { start: number; end: number; events: CalEvent[] };

/**
 * Merge sessions that touch or overlap, so 13:00–14:00 + 14:00–15:00 becomes 13:00–15:00. Starts are
 * already on the full hour: `eventsFor` applies the quarter (see `applyTimeBlocks`).
 */
export function mergeBlocks(events: CalEvent[]): Block[] {
  const sorted = events.map((ev) => ({ start: ev.start, end: ev.end, ev })).sort((a, b) => a.start - b.start || a.end - b.end);
  const out: Block[] = [];
  for (const x of sorted) {
    const last = out[out.length - 1];
    if (last && x.start <= last.end) {
      last.end = Math.max(last.end, x.end);
      last.events.push(x.ev);
    } else {
      out.push({ start: x.start, end: x.end, events: [x.ev] });
    }
  }
  return out;
}
