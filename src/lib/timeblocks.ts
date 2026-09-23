import { and, asc, eq, gt, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { db, dbReady, schema } from "@/db";
import type { Event, TimeBlock, TimeBlockKind } from "@/db/schema";
import { snapStart } from "./blocks";
import { newCode } from "./codes";
import { addDays } from "./time";

/**
 * An event as every view sees it: a timetable session (academic quarter applied, trimmed by free
 * blocks, minus skipped ones) or one of the person's own busy blocks. `personal` is set on the latter.
 */
export type CalEvent = Event & { personal?: { blockId: string; note: string | null; weekly: boolean } };

export type Occurrence = { block: TimeBlock; start: number; end: number };

const WEEK = 7 * 86_400_000;
const MAX_BLOCKS = 200;

/** Occurrences of a block overlapping [from, to). Weekly ones keep their local time across DST. */
export function occurrences(b: TimeBlock, from: number, to: number): Occurrence[] {
  if (!b.weekly) return b.start < to && b.end > from ? [{ block: b, start: b.start, end: b.end }] : [];
  const out: Occurrence[] = [];
  // Weeks are 7×24h except across a DST switch: start one week early rather than miss one.
  for (let k = Math.max(0, Math.floor((from - b.end) / WEEK) - 1); ; k++) {
    const start = addDays(b.start, 7 * k);
    if (start >= to || (b.until != null && start >= b.until)) break;
    const end = addDays(b.end, 7 * k);
    if (end > from) out.push({ block: b, start, end });
  }
  return out;
}

function cut(e: CalEvent, o: { start: number; end: number }): CalEvent[] {
  if (o.end <= e.start || o.start >= e.end) return [e];
  const parts: CalEvent[] = [];
  if (e.start < o.start) parts.push({ ...e, end: o.start });
  if (o.end < e.end) parts.push({ ...e, start: o.end });
  return parts;
}

/**
 * The session a skip leaves out: same times, and the same course (a class) or the same busy block.
 * Whatever else overlaps it stays, so only the hours nothing else covers become free.
 */
function isSkipped(e: CalEvent, b: TimeBlock, o: Occurrence): boolean {
  return e.start === o.start && e.end === o.end && (e.personal ? e.personal.blockId : e.course) === b.target;
}

/**
 * Timetable events with the person's blocks laid over them, in the order they were made: a free
 * block clears everything before it (sessions and older busy blocks), a skip removes one of them,
 * a busy block adds itself.
 */
export function applyTimeBlocks(events: Event[], blocks: TimeBlock[], from: number, to: number): CalEvent[] {
  let out: CalEvent[] = events.map((e) => ({ ...e, start: snapStart(e.start) }));
  let n = 0;
  for (const b of [...blocks].sort((x, y) => x.createdAt - y.createdAt)) {
    for (const o of occurrences(b, from, to)) {
      if (b.kind === "free") out = out.flatMap((e) => cut(e, o));
      else if (b.kind === "skip") out = out.filter((e) => !isSkipped(e, b, o));
      else
        out.push({
          id: -++n,
          userId: b.userId,
          uid: `block:${b.id}:${o.start}`,
          start: o.start,
          end: o.end,
          course: "",
          kind: "other",
          code: null,
          rooms: null,
          teacher: null,
          personal: { blockId: b.id, note: b.note, weekly: b.weekly },
        });
    }
  }
  return out.sort((a, b) => a.start - b.start || a.end - b.end);
}

/** Blocks of these people that may have an occurrence in [from, to). */
export async function timeBlocksBetween(userIds: string[], from: number, to: number): Promise<TimeBlock[]> {
  if (userIds.length === 0) return [];
  await dbReady;
  const t = schema.timeBlocks;
  return db
    .select()
    .from(t)
    .where(and(inArray(t.userId, userIds), lt(t.start, to), or(eq(t.weekly, true), gt(t.end, from)), or(isNull(t.until), gt(t.until, from))));
}

/** Someone's blocks that still matter (not over yet), soonest first. */
export async function listTimeBlocks(userId: string, now = Date.now()): Promise<TimeBlock[]> {
  await dbReady;
  const t = schema.timeBlocks;
  return db
    .select()
    .from(t)
    .where(and(eq(t.userId, userId), or(and(eq(t.weekly, false), gt(t.end, now)), and(eq(t.weekly, true), or(isNull(t.until), gt(t.until, now))))))
    .orderBy(asc(t.weekly), asc(t.start));
}

/** `target` and `note` of a skip: see the schema. */
export type NewTimeBlock = { kind: TimeBlockKind; start: number; end: number; note?: string | null; target?: string; weekly?: boolean; until?: number | null };

/** False when the person already has too many blocks. Callers validate times. */
export async function addTimeBlock(userId: string, b: NewTimeBlock): Promise<boolean> {
  await dbReady;
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(schema.timeBlocks).where(eq(schema.timeBlocks.userId, userId));
  if (n >= MAX_BLOCKS) return false;
  await db.insert(schema.timeBlocks).values({
    id: newCode(12),
    userId,
    kind: b.kind,
    start: b.start,
    end: b.end,
    note: b.kind === "free" ? null : b.note?.trim().slice(0, 80) || null,
    target: b.kind === "skip" ? (b.target ?? null) : null,
    weekly: Boolean(b.weekly),
    until: b.weekly ? (b.until ?? null) : null,
    createdAt: Date.now(),
  });
  return true;
}

export async function getTimeBlock(userId: string, id: string): Promise<TimeBlock | null> {
  await dbReady;
  const [b] = await db.select().from(schema.timeBlocks).where(and(eq(schema.timeBlocks.userId, userId), eq(schema.timeBlocks.id, id))).limit(1);
  return b ?? null;
}

export async function removeTimeBlock(userId: string, id: string): Promise<void> {
  await dbReady;
  await db.delete(schema.timeBlocks).where(and(eq(schema.timeBlocks.userId, userId), eq(schema.timeBlocks.id, id)));
}
