/**
 * Pure free/busy maths for the group view. Safe to import from client components.
 * Days are Mon–Fri only, and Zurich's DST switches happen on Sundays, so
 * `dayStart + hours` is exact for every day this module handles.
 */

export type Interval = { start: number; end: number };

export type MemberData = {
  id: string;
  name: string;
  isSelf: boolean;
  hasCalendar: boolean;
  blocks: Interval[]; // merged busy blocks for the week (academic quarter already applied)
};

const MIN = 60_000;
const SLOT = 15 * MIN;

/** Default window for suggesting meeting times. */
export const DAY_FROM_H = 8;
export const DAY_TO_H = 19;

export function dayWindow(dayStart: number, fromH = DAY_FROM_H, toH = DAY_TO_H): Interval {
  return { start: dayStart + fromH * 60 * MIN, end: dayStart + toH * 60 * MIN };
}

export function ceilToSlot(ms: number): number {
  return Math.ceil(ms / SLOT) * SLOT;
}

/** Windows of at least `minMinutes` inside [from, to) where every member with a calendar is free. */
export function commonFree(members: MemberData[], win: Interval, notBefore = -Infinity, minMinutes = 30): Interval[] {
  const start = Math.max(win.start, ceilToSlot(notBefore));
  if (start >= win.end) return [];
  const busy = members
    .filter((m) => m.hasCalendar)
    .flatMap((m) => m.blocks)
    .filter((b) => b.end > start && b.start < win.end)
    .sort((a, b) => a.start - b.start);
  const out: Interval[] = [];
  let cursor = start;
  for (const b of busy) {
    if (b.start > cursor) out.push({ start: cursor, end: Math.min(b.start, win.end) });
    cursor = Math.max(cursor, b.end);
    if (cursor >= win.end) break;
  }
  if (cursor < win.end) out.push({ start: cursor, end: win.end });
  return out.filter((w) => w.end - w.start >= minMinutes * MIN);
}

export type Run = Interval & { busy: number; busyIds: string[] };

/** 15-minute resolution runs of "how many members are busy", merged when the set of busy people doesn't change. */
export function busyRuns(members: MemberData[], win: Interval): Run[] {
  const withCal = members.filter((m) => m.hasCalendar);
  const runs: Run[] = [];
  for (let t = win.start; t < win.end; t += SLOT) {
    const ids = withCal.filter((m) => m.blocks.some((b) => b.start < t + SLOT && b.end > t)).map((m) => m.id);
    const last = runs[runs.length - 1];
    if (last && last.busyIds.join() === ids.join()) last.end = t + SLOT;
    else runs.push({ start: t, end: t + SLOT, busy: ids.length, busyIds: ids });
  }
  return runs;
}

export function hoursSpan(members: MemberData[], dayStarts: number[], localHour: (ms: number) => number): { fromH: number; toH: number } {
  let fromH = DAY_FROM_H;
  let toH = DAY_TO_H;
  const days = new Set(dayStarts);
  for (const m of members) {
    for (const b of m.blocks) {
      const ds = dayStarts.find((d) => b.start >= d && b.start < d + 86_400_000);
      if (ds == null || !days.has(ds)) continue;
      fromH = Math.min(fromH, Math.floor(localHour(b.start)));
      toH = Math.max(toH, Math.ceil(localHour(b.end) || 24));
    }
  }
  return { fromH, toH };
}
