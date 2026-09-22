import { and, asc, gte, inArray, lt } from "drizzle-orm";
import { db, dbReady, schema } from "@/db";
import { mergeBlocks } from "./blocks";
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
  await dbReady;
  const from = dayStartOf(now);
  const to = addDays(from, LOOKAHEAD_DAYS);
  const [rows, cals] = await Promise.all([
    db.select().from(schema.events).where(and(inArray(schema.events.userId, everyone), lt(schema.events.start, to), gte(schema.events.end, from))).orderBy(asc(schema.events.start)),
    db.select({ userId: schema.calendars.userId }).from(schema.calendars).where(inArray(schema.calendars.userId, everyone)),
  ]);
  const hasCal = new Set(cals.map((c) => c.userId));
  const blocks = new Map(everyone.map((id) => [id, mergeBlocks(rows.filter((r) => r.userId === id)).map(({ start, end }) => ({ start, end }))]));

  for (const g of groups) {
    const members: MemberData[] = g.userIds.map((id) => ({ id, name: "", image: null, isSelf: false, hasCalendar: hasCal.has(id), blocks: blocks.get(id) ?? [] }));
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
