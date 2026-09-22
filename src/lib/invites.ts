import { and, eq, inArray, or } from "drizzle-orm";
import { db, dbReady, schema } from "@/db";
import type { SavedGroup, User } from "@/db/schema";
import { setStar } from "./stars";
import { isCode, newCode } from "./codes";

/**
 * Organic growth: personal invite links (/i/<code>) and group links (/g/<code>).
 * Following a link and signing in connects you straight away (accepted both ways), so a new
 * account opens on a populated app: the inviter, or everyone in the group.
 */


export async function inviteCodeFor(user: User): Promise<string> {
  if (user.inviteCode) return user.inviteCode;
  await dbReady;
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    try {
      await db.update(schema.users).set({ inviteCode: code }).where(eq(schema.users.id, user.id));
      return code;
    } catch {
      /* unique clash, try another */
    }
  }
  throw new Error("could not allocate invite code");
}

export async function userByInviteCode(code: string): Promise<User | null> {
  if (!isCode(code)) return null;
  await dbReady;
  const [u] = await db.select().from(schema.users).where(eq(schema.users.inviteCode, code)).limit(1);
  return u ?? null;
}

/** Make a and b connected (accepted), whatever state they were in. */
export async function connectAccepted(a: string, b: string): Promise<void> {
  if (a === b) return;
  await dbReady;
  const existing = await db
    .select()
    .from(schema.connections)
    .where(
      or(
        and(eq(schema.connections.requesterId, a), eq(schema.connections.addresseeId, b)),
        and(eq(schema.connections.requesterId, b), eq(schema.connections.addresseeId, a)),
      ),
    );
  if (existing.length) {
    const c = existing[0];
    if (c.status !== "accepted")
      await db
        .update(schema.connections)
        .set({ status: "accepted" })
        .where(and(eq(schema.connections.requesterId, c.requesterId), eq(schema.connections.addresseeId, c.addresseeId)));
    return;
  }
  await db.insert(schema.connections).values({ requesterId: b, addresseeId: a, status: "accepted", createdAt: Date.now() });
}

export async function acceptPersonalInvite(viewer: User, code: string): Promise<User | null> {
  const inviter = await userByInviteCode(code);
  if (!inviter) return null;
  await connectAccepted(viewer.id, inviter.id);
  return inviter;
}

export type GroupInvite = { group: SavedGroup; owner: User; people: User[] }; // people includes the creator

export async function groupByInviteCode(code: string): Promise<GroupInvite | null> {
  if (!isCode(code)) return null;
  await dbReady;
  const [group] = await db.select().from(schema.savedGroups).where(eq(schema.savedGroups.inviteCode, code)).limit(1);
  if (!group) return null;
  const rows = await db
    .select({ u: schema.users })
    .from(schema.savedGroupMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.savedGroupMembers.userId))
    .where(eq(schema.savedGroupMembers.groupId, group.id));
  const people = rows.map((r) => r.u);
  const owner = people.find((p) => p.id === group.ownerId) ?? people[0];
  return { group, owner, people: [owner, ...people.filter((p) => p.id !== owner.id)] };
}

/** Join through a group link: become a member and get connected with everyone already in it. */
export async function joinGroup(viewer: User, code: string): Promise<GroupInvite | null> {
  const inv = await groupByInviteCode(code);
  if (!inv) return null;
  if (!inv.people.some((p) => p.id === viewer.id)) {
    await db.insert(schema.savedGroupMembers).values({ groupId: inv.group.id, userId: viewer.id }).onConflictDoNothing();
  }
  for (const p of inv.people) await connectAccepted(viewer.id, p.id);
  await setStar(viewer.id, "group", inv.group.id, true);
  return { ...inv, people: inv.people.some((p) => p.id === viewer.id) ? inv.people : [...inv.people, viewer] };
}

export async function usersByIds(ids: string[]): Promise<User[]> {
  if (!ids.length) return [];
  await dbReady;
  return db.select().from(schema.users).where(inArray(schema.users.id, ids));
}
