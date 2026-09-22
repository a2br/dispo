import { and, eq, inArray, or } from "drizzle-orm";
import { db, dbReady, schema } from "@/db";
import type { SavedGroup, User } from "@/db/schema";
import { setStar } from "./stars";

/**
 * Organic growth: personal invite links (/i/<code>) and group links (/g/<code>).
 * Following a link and signing in connects you straight away (accepted both ways), so a new
 * account opens on a populated app: the inviter, or everyone in the group.
 */

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no 0/o/1/l/i
function newCode(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function isCode(s: string): boolean {
  return /^[a-z2-9]{6,16}$/.test(s);
}

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

export type GroupInvite = { group: SavedGroup; owner: User; people: User[] }; // people = owner + members

export async function groupByInviteCode(code: string): Promise<GroupInvite | null> {
  if (!isCode(code)) return null;
  await dbReady;
  const [group] = await db.select().from(schema.savedGroups).where(eq(schema.savedGroups.inviteCode, code)).limit(1);
  if (!group) return null;
  const [owner] = await db.select().from(schema.users).where(eq(schema.users.id, group.ownerId)).limit(1);
  const rows = await db
    .select({ u: schema.users })
    .from(schema.savedGroupMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.savedGroupMembers.userId))
    .where(eq(schema.savedGroupMembers.groupId, group.id));
  return { group, owner, people: [owner, ...rows.map((r) => r.u).filter((u) => u.id !== owner.id)] };
}

/** Give a group a share link (making it visible to its members). Owner only. */
export async function ensureGroupInviteCode(ownerId: string, groupId: string): Promise<string | null> {
  await dbReady;
  const [g] = await db
    .select()
    .from(schema.savedGroups)
    .where(and(eq(schema.savedGroups.id, groupId), eq(schema.savedGroups.ownerId, ownerId)))
    .limit(1);
  if (!g) return null;
  if (g.inviteCode) return g.inviteCode;
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    try {
      await db.update(schema.savedGroups).set({ inviteCode: code }).where(eq(schema.savedGroups.id, groupId));
      return code;
    } catch {
      /* clash */
    }
  }
  return null;
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

export async function leaveGroup(viewer: User, groupId: string): Promise<void> {
  await dbReady;
  await db.delete(schema.savedGroupMembers).where(and(eq(schema.savedGroupMembers.groupId, groupId), eq(schema.savedGroupMembers.userId, viewer.id)));
}

export async function usersByIds(ids: string[]): Promise<User[]> {
  if (!ids.length) return [];
  await dbReady;
  return db.select().from(schema.users).where(inArray(schema.users.id, ids));
}
