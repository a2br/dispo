import { and, eq, inArray, ne, or, sql } from "drizzle-orm";
import { db, dbReady, schema } from "@/db";
import type { User } from "@/db/schema";

export type Course = { key: string; code: string | null; name: string; sessions: number };

/** Distinct courses per user, keyed by course code (falls back to the name). */
export async function coursesFor(userIds: string[]): Promise<Map<string, Course[]>> {
  const out = new Map<string, Course[]>();
  if (userIds.length === 0) return out;
  await dbReady;
  const rows = await db
    .select({ userId: schema.events.userId, code: schema.events.code, name: schema.events.course, sessions: sql<number>`count(*)` })
    .from(schema.events)
    .where(inArray(schema.events.userId, userIds))
    .groupBy(schema.events.userId, schema.events.code, schema.events.course);
  for (const r of rows) {
    const key = r.code ?? `name:${r.name.toLowerCase()}`;
    const list = out.get(r.userId) ?? out.set(r.userId, []).get(r.userId)!;
    const existing = list.find((c) => c.key === key);
    if (existing) existing.sessions += Number(r.sessions);
    else list.push({ key, code: r.code, name: r.name, sessions: Number(r.sessions) });
  }
  for (const list of out.values()) list.sort((a, b) => (a.code ?? a.name).localeCompare(b.code ?? b.name));
  return out;
}

export async function myCourses(userId: string): Promise<Course[]> {
  return (await coursesFor([userId])).get(userId) ?? [];
}

/** Users with a calendar that the viewer is allowed to discover: everyone except private users they aren't connected to. */
async function discoverableUsers(viewer: User): Promise<User[]> {
  await dbReady;
  const rows = await db
    .select({ u: schema.users })
    .from(schema.users)
    .innerJoin(schema.calendars, eq(schema.calendars.userId, schema.users.id))
    .where(ne(schema.users.id, viewer.id));
  const users = rows.map((r) => r.u).filter((u) => u.discoverable);
  const privateIds = users.filter((u) => u.visibility === "private").map((u) => u.id);
  if (privateIds.length === 0) return users;
  const cs = await db
    .select()
    .from(schema.connections)
    .where(
      and(
        eq(schema.connections.status, "accepted"),
        or(
          and(eq(schema.connections.requesterId, viewer.id), inArray(schema.connections.addresseeId, privateIds)),
          and(eq(schema.connections.addresseeId, viewer.id), inArray(schema.connections.requesterId, privateIds)),
        ),
      ),
    );
  const ok = new Set(cs.map((c) => (c.requesterId === viewer.id ? c.addresseeId : c.requesterId)));
  return users.filter((u) => u.visibility !== "private" || ok.has(u.id));
}

export type Classmate = { user: User; shared: Course[]; theirTotal: number };

/**
 * People ranked by how many of the viewer's courses they share.
 * Only the *shared* courses are revealed (the viewer sits in those lecture halls anyway);
 * the rest of someone's timetable stays behind the normal visibility rules.
 */
export async function classmatesFor(viewer: User): Promise<{ mine: Course[]; classmates: Classmate[] }> {
  const mine = await myCourses(viewer.id);
  if (!viewer.discoverable) return { mine, classmates: [] }; // opted out of Discover: neither seen nor seeing
  if (mine.length === 0) return { mine, classmates: [] };
  const users = await discoverableUsers(viewer);
  const courses = await coursesFor(users.map((u) => u.id));
  const classmates: Classmate[] = [];
  for (const u of users) {
    const theirs = courses.get(u.id) ?? [];
    const shared = mine.filter((c) => theirs.some((t) => t.key === c.key));
    if (shared.length > 0) classmates.push({ user: u, shared, theirTotal: theirs.length });
  }
  classmates.sort((a, b) => b.shared.length - a.shared.length || a.user.name.localeCompare(b.user.name));
  return { mine, classmates };
}

/** Courses the viewer shares with one specific person (null when either has no calendar). */
export async function sharedCourses(viewerId: string, otherId: string): Promise<{ mine: Course[]; shared: Course[] } | null> {
  const map = await coursesFor([viewerId, otherId]);
  const mine = map.get(viewerId);
  const theirs = map.get(otherId);
  if (!mine || !theirs) return null;
  return { mine, shared: mine.filter((c) => theirs.some((t) => t.key === c.key)) };
}

/** People visible to the viewer who take a given course, provided the viewer takes it too. */
export async function peopleInCourse(viewer: User, key: string): Promise<{ course: Course; people: User[] } | null> {
  if (!viewer.discoverable) return null;
  const mine = await myCourses(viewer.id);
  const course = mine.find((c) => c.key === key);
  if (!course) return null;
  const users = await discoverableUsers(viewer);
  const courses = await coursesFor(users.map((u) => u.id));
  const people = users.filter((u) => (courses.get(u.id) ?? []).some((c) => c.key === key)).sort((a, b) => a.name.localeCompare(b.name));
  return { course, people };
}

