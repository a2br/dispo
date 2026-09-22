import { and, eq, or } from "drizzle-orm";
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

/** What the viewer may see of the target's schedule. */
export function accessFor(target: User, rel: Relation): Access {
  if (rel.kind === "self" || rel.kind === "accepted") return "full";
  switch (target.visibility) {
    case "everyone":
      return "full";
    case "connections":
      return "busy";
    case "private":
      return "none";
  }
}
