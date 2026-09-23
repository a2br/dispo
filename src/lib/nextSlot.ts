import { mergeBlocks } from "./blocks";
import { eventsFor, usersWithCalendar } from "./calendar";
import { commonFree, dayWindow, type Interval, type MemberData } from "./groupcalc";
import { addDays, dayStartOf, localParts } from "./time";

const LOOKAHEAD_DAYS = 14;

/**
 * Next window (≥30 min, 08:00–19:00, weekdays) when everyone in `userIds` who has a schedule is
 * free, starting now. `now: true` when that window is already running.
 */
export async function nextCommonSlots(groups: { id: string; userIds: string[] }[], now = Date.now()): Promise<Map<string, (Interval & { now: boolean }) | null>> {
  const out = new Map<string, (Interval & { now: boolean }) | null>();
  const everyone = [...new Set(groups.flatMap((g) => g.userIds))];
  if (everyone.length === 0) return out;
  const from = dayStartOf(now);
  const [events, hasCal] = await Promise.all([eventsFor(everyone, from, addDays(from, LOOKAHEAD_DAYS)), usersWithCalendar(everyone)]);
  const blocks = new Map(everyone.map((id) => [id, mergeBlocks(events.get(id) ?? []).map(({ start, end }) => ({ start, end }))]));

  for (const g of groups) {
    const members: MemberData[] = g.userIds.map((id) => ({ id, name: "", isSelf: false, hasCalendar: hasCal.has(id), blocks: blocks.get(id) ?? [] }));
    if (members.filter((m) => m.hasCalendar).length < 2) {
      out.set(g.id, null);
      continue;
    }
    let found: (Interval & { now: boolean }) | null = null;
    for (let d = 0; d < LOOKAHEAD_DAYS && !found; d++) {
      const ds = addDays(from, d);
      if (localParts(ds).day >= 5) continue; // weekends
      const w = commonFree(members, dayWindow(ds), now)[0];
      if (w) found = { ...w, now: w.start <= now + 60_000 };
    }
    out.set(g.id, found);
  }
  return out;
}
