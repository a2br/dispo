import { and, asc, eq, gte, inArray, lt, notInArray, sql } from "drizzle-orm";
import { db, dbReady, schema } from "@/db";
import type { Calendar, Event, User } from "@/db/schema";
import { decrypt, encrypt } from "./crypto";
import { IcsError, fetchIcs, normalizeIcsUrl, parseIcs, type ParsedEvent } from "./ics";
import { dayStartOf } from "./time";
import { mergeBlocks } from "./blocks";

export const STALE_MS = 6 * 60 * 60 * 1000;

export async function getCalendar(userId: string): Promise<Calendar | null> {
  await dbReady;
  const [c] = await db.select().from(schema.calendars).where(eq(schema.calendars.userId, userId)).limit(1);
  return c ?? null;
}

/** Validate a pasted link, fetch it once, store it encrypted and load its events. */
export async function connectCalendar(userId: string, rawUrl: string): Promise<{ count: number }> {
  const url = normalizeIcsUrl(rawUrl);
  const text = await fetchIcs(url);
  const parsed = parseIcs(text);
  if (parsed.length === 0) throw new IcsError("empty", "The calendar is empty. Is the semester schedule published yet?");
  await dbReady;
  const now = Date.now();
  await db
    .insert(schema.calendars)
    .values({ userId, encUrl: encrypt(url), lastFetchedAt: now, lastOkAt: now, lastError: null, eventCount: parsed.length, createdAt: now })
    .onConflictDoUpdate({
      target: schema.calendars.userId,
      set: { encUrl: encrypt(url), lastFetchedAt: now, lastOkAt: now, lastError: null, eventCount: parsed.length },
    });
  await replaceEvents(userId, parsed);
  return { count: parsed.length };
}

export async function disconnectCalendar(userId: string): Promise<void> {
  await dbReady;
  await db.delete(schema.events).where(eq(schema.events.userId, userId));
  await db.delete(schema.calendars).where(eq(schema.calendars.userId, userId));
}

/** Re-fetch one user's feed. Never throws; records the error on the calendar row. */
export async function refreshCalendar(userId: string): Promise<{ ok: boolean; count: number; error?: string }> {
  const cal = await getCalendar(userId);
  if (!cal) return { ok: false, count: 0, error: "no calendar" };
  const now = Date.now();
  try {
    const parsed = parseIcs(await fetchIcs(decrypt(cal.encUrl)));
    // A feed that suddenly comes back empty is more likely a hiccup than a real change; keep old data.
    if (parsed.length > 0) await replaceEvents(userId, parsed);
    await db
      .update(schema.calendars)
      .set({ lastFetchedAt: now, lastOkAt: now, lastError: null, eventCount: parsed.length })
      .where(eq(schema.calendars.userId, userId));
    return { ok: true, count: parsed.length };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // A code, not text: Me shows it in the reader's language (see icsErrorText).
    const lastError = e instanceof IcsError ? e.key : "failed";
    await db.update(schema.calendars).set({ lastFetchedAt: now, lastError }).where(eq(schema.calendars.userId, userId));
    return { ok: false, count: cal.eventCount, error: msg };
  }
}

/** Refresh in place if older than STALE_MS. Returns true when a refresh ran. */
export async function refreshIfStale(userId: string): Promise<boolean> {
  const cal = await getCalendar(userId);
  if (!cal) return false;
  if (cal.lastFetchedAt && Date.now() - cal.lastFetchedAt < STALE_MS) return false;
  await refreshCalendar(userId);
  return true;
}

export async function refreshAllStale(): Promise<{ refreshed: number; failed: number }> {
  await dbReady;
  const cutoff = Date.now() - STALE_MS;
  const rows = await db
    .select({ userId: schema.calendars.userId })
    .from(schema.calendars)
    .where(sql`${schema.calendars.lastFetchedAt} IS NULL OR ${schema.calendars.lastFetchedAt} < ${cutoff}`);
  let refreshed = 0;
  let failed = 0;
  for (const r of rows) {
    const res = await refreshCalendar(r.userId);
    if (res.ok) refreshed++;
    else failed++;
  }
  return { refreshed, failed };
}

async function replaceEvents(userId: string, parsed: ParsedEvent[]): Promise<void> {
  const uids = parsed.map((p) => p.uid);
  await db.transaction(async (tx) => {
    if (uids.length) await tx.delete(schema.events).where(and(eq(schema.events.userId, userId), notInArray(schema.events.uid, uids)));
    else await tx.delete(schema.events).where(eq(schema.events.userId, userId));
    const CHUNK = 40;
    for (let i = 0; i < parsed.length; i += CHUNK) {
      const chunk = parsed.slice(i, i + CHUNK).map((p) => ({ ...p, userId }));
      await tx
        .insert(schema.events)
        .values(chunk)
        .onConflictDoUpdate({
          target: [schema.events.userId, schema.events.uid],
          set: {
            start: sql`excluded.start`,
            end: sql`excluded.end`,
            course: sql`excluded.course`,
            kind: sql`excluded.kind`,
            code: sql`excluded.code`,
            rooms: sql`excluded.rooms`,
            teacher: sql`excluded.teacher`,
          },
        });
    }
  });
}

// ---------- queries ----------

export async function eventsBetween(userId: string, from: number, to: number): Promise<Event[]> {
  await dbReady;
  return db
    .select()
    .from(schema.events)
    .where(and(eq(schema.events.userId, userId), lt(schema.events.start, to), gte(schema.events.end, from)))
    .orderBy(asc(schema.events.start));
}

export type Status =
  | { state: "busy"; until: number; event: Event }
  | { state: "free"; until: number | null; next: Event | null } // until = next start today, null = free rest of day
  | { state: "unknown" }
  // Not shown to this viewer: the person keeps their schedule private, or the viewer hasn't added theirs yet.
  | { state: "hidden"; reason: "private" | "needs-schedule" };

export function statusFrom(events: Event[], now = Date.now()): Status {
  const dayEnd = dayStartOf(now) + 86_400_000;
  const blocks = mergeBlocks(events);
  const current = blocks.find((b) => b.start <= now && now < b.end);
  if (current) {
    // During the 13:00–13:15 quarter no session has started yet; report the one about to begin.
    const event = current.events.find((e) => e.start <= now && now < e.end) ?? current.events.find((e) => e.end > now) ?? current.events[0];
    return { state: "busy", until: current.end, event };
  }
  const next = blocks.find((b) => b.start > now && b.start < dayEnd) ?? null;
  return { state: "free", until: next ? next.start : null, next: next ? next.events[0] : null };
}

/** Status right now for many users in one query. */
export async function statusesFor(userIds: string[], now = Date.now()): Promise<Map<string, Status>> {
  const out = new Map<string, Status>();
  if (userIds.length === 0) return out;
  await dbReady;
  const from = dayStartOf(now);
  const to = from + 86_400_000;
  const rows = await db
    .select()
    .from(schema.events)
    .where(and(inArray(schema.events.userId, userIds), lt(schema.events.start, to), gte(schema.events.end, from)))
    .orderBy(asc(schema.events.start));
  const cals = await db.select({ userId: schema.calendars.userId }).from(schema.calendars).where(inArray(schema.calendars.userId, userIds));
  const hasCal = new Set(cals.map((c) => c.userId));
  const byUser = new Map<string, Event[]>();
  for (const r of rows) (byUser.get(r.userId) ?? byUser.set(r.userId, []).get(r.userId)!).push(r);
  for (const id of userIds) {
    out.set(id, hasCal.has(id) ? statusFrom(byUser.get(id) ?? [], now) : { state: "unknown" });
  }
  return out;
}

// ---------- people ----------

/** Name/email search over everyone on dispo, regardless of their visibility settings. */
export async function searchUsers(viewer: User, q: string, limit = 20): Promise<User[]> {
  await dbReady;
  const needle = `%${q.trim().toLowerCase().replace(/[%_]/g, "")}%`;
  if (needle === "%%") return [];
  const rows = await db
    .select()
    .from(schema.users)
    .where(
      and(
        sql`(lower(${schema.users.name}) LIKE ${needle} OR lower(${schema.users.email}) LIKE ${needle})`,
        sql`${schema.users.id} != ${viewer.id}`,
      ),
    )
    .limit(limit * 2);
  // Everyone can be found by name (so people can always send a connection request);
  // what a result reveals about their schedule is decided per viewer, not here.
  return rows.slice(0, limit);
}

export async function connectionsOf(userId: string): Promise<{ accepted: User[]; incoming: User[]; outgoing: User[] }> {
  await dbReady;
  const rows = await db
    .select({ c: schema.connections, u: schema.users })
    .from(schema.connections)
    .innerJoin(
      schema.users,
      sql`${schema.users.id} = CASE WHEN ${schema.connections.requesterId} = ${userId} THEN ${schema.connections.addresseeId} ELSE ${schema.connections.requesterId} END`,
    )
    .where(sql`${schema.connections.requesterId} = ${userId} OR ${schema.connections.addresseeId} = ${userId}`)
    .orderBy(asc(schema.users.name));
  const accepted: User[] = [];
  const incoming: User[] = [];
  const outgoing: User[] = [];
  for (const { c, u } of rows) {
    if (c.status === "accepted") accepted.push(u);
    else if (c.addresseeId === userId) incoming.push(u);
    else outgoing.push(u);
  }
  return { accepted, incoming, outgoing };
}

export async function getUserById(id: string): Promise<User | null> {
  await dbReady;
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  return u ?? null;
}


/** Today's merged busy blocks for many users (academic quarter applied), for the timeline strips. */
export async function todayBlocksFor(userIds: string[], now = Date.now()): Promise<Map<string, { start: number; end: number }[]>> {
  const out = new Map<string, { start: number; end: number }[]>();
  if (userIds.length === 0) return out;
  await dbReady;
  const from = dayStartOf(now);
  const to = from + 86_400_000;
  const rows = await db
    .select()
    .from(schema.events)
    .where(and(inArray(schema.events.userId, userIds), lt(schema.events.start, to), gte(schema.events.end, from)))
    .orderBy(asc(schema.events.start));
  for (const id of userIds) out.set(id, mergeBlocks(rows.filter((r) => r.userId === id)).map(({ start, end }) => ({ start, end })));
  return out;
}

export async function usersWithCalendar(userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();
  await dbReady;
  const rows = await db.select({ userId: schema.calendars.userId }).from(schema.calendars).where(inArray(schema.calendars.userId, userIds));
  return new Set(rows.map((r) => r.userId));
}
