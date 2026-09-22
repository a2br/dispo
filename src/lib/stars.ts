import { and, eq } from "drizzle-orm";
import { db, dbReady, schema } from "@/db";

export type StarKind = "user" | "group";
export type Stars = { users: Set<string>; groups: Set<string> };

export async function starsOf(userId: string): Promise<Stars> {
  await dbReady;
  const rows = await db.select().from(schema.stars).where(eq(schema.stars.userId, userId));
  return {
    users: new Set(rows.filter((r) => r.kind === "user").map((r) => r.targetId)),
    groups: new Set(rows.filter((r) => r.kind === "group").map((r) => r.targetId)),
  };
}

export async function setStar(userId: string, kind: StarKind, targetId: string, on: boolean): Promise<void> {
  await dbReady;
  if (on) await db.insert(schema.stars).values({ userId, kind, targetId, createdAt: Date.now() }).onConflictDoNothing();
  else await db.delete(schema.stars).where(and(eq(schema.stars.userId, userId), eq(schema.stars.kind, kind), eq(schema.stars.targetId, targetId)));
}
