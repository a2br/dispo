import { and, eq, or } from "drizzle-orm";
import { cache } from "react";
import { statusesFor, type Status } from "./calendar";
import { db, dbReady, schema } from "@/db";
import type { Connection, User } from "@/db/schema";

export type Relation =
  | { kind: "self" }
  | { kind: "none" }
  | { kind: "accepted" }
  | { kind: "outgoing" } // I asked, waiting
  | { kind: "incoming" }; // they asked me

export async function connectionBetween(a: string, b: string): Promise<Connection | null> {
  await dbReady;
  const rows = await db
    .select()
    .from(schema.connections)
    .where(
      or(
        and(eq(schema.connections.requesterId, a), eq(schema.connections.addresseeId, b)),
        and(eq(schema.connections.requesterId, b), eq(schema.connections.addresseeId, a)),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function relationTo(viewerId: string, target: User): Promise<Relation> {
  if (viewerId === target.id) return { kind: "self" };
  const c = await connectionBetween(viewerId, target.id);
  if (!c) return { kind: "none" };
  if (c.status === "accepted") return { kind: "accepted" };
  return c.requesterId === viewerId ? { kind: "outgoing" } : { kind: "incoming" };
}

export type Access = "full" | "busy" | "none";

/** Whether this person has added their own schedule (memoised per request). */
export const hasSchedule = cache(async (userId: string): Promise<boolean> => {
  await dbReady;
  const rows = await db.select({ id: schema.calendars.userId }).from(schema.calendars).where(eq(schema.calendars.userId, userId)).limit(1);
  return rows.length > 0;
});

/**
 * What the viewer may see of the target's schedule. Give to get: until you've added your own
 * schedule, you only see your connections'. Public links (/s/…) are the owner's choice and bypass this.
 */
export function accessFor(target: User, rel: Relation, viewerHasSchedule = true): Access {
  if (rel.kind === "self" || rel.kind === "accepted") return "full";
  if (!viewerHasSchedule) return "none";
  switch (target.visibility) {
    case "everyone":
      return "full";
    case "connections":
      return "busy";
    case "private":
      return "none";
  }
}

/** Why a schedule is hidden from this viewer, or null if it isn't. */
export function hiddenReason(target: User, rel: Relation, viewerHasSchedule: boolean): "private" | "needs-schedule" | null {
  if (accessFor(target, rel, viewerHasSchedule) !== "none") return null;
  return viewerHasSchedule ? "private" : "needs-schedule";
}

/** Live statuses for a list of people, with hidden ones replaced by why they're hidden. */
export async function visibleStatuses(viewer: User, people: User[]): Promise<Map<string, Status>> {
  const mine = await hasSchedule(viewer.id);
  const allowed: User[] = [];
  const out = new Map<string, Status>();
  for (const u of people) {
    const reason = hiddenReason(u, await relationTo(viewer.id, u), mine);
    if (reason) out.set(u.id, { state: "hidden", reason });
    else allowed.push(u);
  }
  const live = await statusesFor(allowed.map((u) => u.id));
  for (const [id, st] of live) out.set(id, st);
  return out;
}
