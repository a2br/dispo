import { and, asc, eq, inArray } from "drizzle-orm";
import { db, dbReady, schema } from "@/db";
import type { SavedGroup, User } from "@/db/schema";
import { newCode } from "./codes";

/**
 * Groups work like a group chat: everyone in a group sees it, every group has an invite link
 * (/g/<code>), and the creator is a member like everyone else. Any member can rename the group
 * and add their connections; anyone can leave; only the creator can delete it.
 */

export const MAX_GROUP_MEMBERS = 12;

/** `members` = everyone in the group except the viewer. */
export type GroupWithMembers = SavedGroup & { members: User[]; isOwner: boolean };
/** `people` = everyone in the group, viewer included. */
export type GroupDetail = SavedGroup & { people: User[]; isOwner: boolean };

async function memberRows(groupIds: string[]) {
  if (!groupIds.length) return [];
  return db
    .select({ groupId: schema.savedGroupMembers.groupId, u: schema.users })
    .from(schema.savedGroupMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.savedGroupMembers.userId))
    .where(inArray(schema.savedGroupMembers.groupId, groupIds))
    .orderBy(asc(schema.users.name));
}

export async function listGroups(viewerId: string): Promise<GroupWithMembers[]> {
  await dbReady;
  const mine = await db.select({ id: schema.savedGroupMembers.groupId }).from(schema.savedGroupMembers).where(eq(schema.savedGroupMembers.userId, viewerId));
  if (!mine.length) return [];
  const groups = await db
    .select()
    .from(schema.savedGroups)
    .where(inArray(schema.savedGroups.id, mine.map((r) => r.id)))
    .orderBy(asc(schema.savedGroups.name));
  const rows = await memberRows(groups.map((g) => g.id));
  return groups.map((g) => ({
    ...g,
    isOwner: g.ownerId === viewerId,
    members: rows.filter((r) => r.groupId === g.id && r.u.id !== viewerId).map((r) => r.u),
  }));
}

/** A group with all its people, or null if the viewer isn't in it. */
export async function getGroup(viewerId: string, id: string): Promise<GroupDetail | null> {
  await dbReady;
  const [g] = await db.select().from(schema.savedGroups).where(eq(schema.savedGroups.id, id)).limit(1);
  if (!g) return null;
  const people = (await memberRows([id])).map((r) => r.u);
  if (!people.some((p) => p.id === viewerId)) return null;
  return { ...g, people, isOwner: g.ownerId === viewerId };
}

function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, 60);
}

/**
 * Who you can add directly: your connections and people you're already in a group with.
 * Everyone else joins through the group's link.
 */
async function addableSubset(viewerId: string, ids: string[]): Promise<string[]> {
  const wanted = [...new Set(ids.map((s) => s.trim()).filter((s) => s && s !== viewerId))];
  if (!wanted.length) return [];
  const rows = await db.select().from(schema.connections).where(eq(schema.connections.status, "accepted"));
  const ok = new Set(rows.flatMap((c) => (c.requesterId === viewerId ? [c.addresseeId] : c.addresseeId === viewerId ? [c.requesterId] : [])));
  for (const id of wanted) if (!ok.has(id) && (await shareAGroup(viewerId, id))) ok.add(id);
  return wanted.filter((id) => ok.has(id));
}

export async function createGroup(ownerId: string, name: string, memberIds: string[]): Promise<{ id: string; inviteCode: string }> {
  await dbReady;
  const id = crypto.randomUUID();
  const inviteCode = newCode();
  const members = (await addableSubset(ownerId, memberIds)).slice(0, MAX_GROUP_MEMBERS - 1);
  await db.transaction(async (tx) => {
    await tx.insert(schema.savedGroups).values({ id, ownerId, name: cleanName(name) || "Untitled group", inviteCode, createdAt: Date.now() });
    await tx.insert(schema.savedGroupMembers).values([ownerId, ...members].map((userId) => ({ groupId: id, userId })));
  });
  return { id, inviteCode };
}

export async function addMembers(viewerId: string, groupId: string, ids: string[]): Promise<void> {
  const g = await getGroup(viewerId, groupId);
  if (!g) return;
  const room = MAX_GROUP_MEMBERS - g.people.length;
  const add = (await addableSubset(viewerId, ids)).filter((id) => !g.people.some((p) => p.id === id)).slice(0, Math.max(0, room));
  if (add.length) await db.insert(schema.savedGroupMembers).values(add.map((userId) => ({ groupId, userId }))).onConflictDoNothing();
}

export async function renameGroup(viewerId: string, groupId: string, name: string): Promise<void> {
  const n = cleanName(name);
  if (!n || !(await getGroup(viewerId, groupId))) return;
  await db.update(schema.savedGroups).set({ name: n }).where(eq(schema.savedGroups.id, groupId));
}

export async function deleteGroup(viewerId: string, groupId: string): Promise<void> {
  await dbReady;
  await db.delete(schema.savedGroups).where(and(eq(schema.savedGroups.id, groupId), eq(schema.savedGroups.ownerId, viewerId)));
}

/** Leave; if the creator leaves, the group passes to the next member; the last one out deletes it. */
export async function leaveGroup(viewerId: string, groupId: string): Promise<void> {
  const g = await getGroup(viewerId, groupId);
  if (!g) return;
  const rest = g.people.filter((p) => p.id !== viewerId);
  if (!rest.length) {
    await db.delete(schema.savedGroups).where(eq(schema.savedGroups.id, groupId));
    return;
  }
  await db.delete(schema.savedGroupMembers).where(and(eq(schema.savedGroupMembers.groupId, groupId), eq(schema.savedGroupMembers.userId, viewerId)));
  if (g.ownerId === viewerId) await db.update(schema.savedGroups).set({ ownerId: rest[0].id }).where(eq(schema.savedGroups.id, groupId));
}

/** True when a and b are in at least one group together (enough to see each other's free/busy there). */
export async function shareAGroup(a: string, b: string): Promise<boolean> {
  await dbReady;
  const ga = await db.select({ id: schema.savedGroupMembers.groupId }).from(schema.savedGroupMembers).where(eq(schema.savedGroupMembers.userId, a));
  if (!ga.length) return false;
  const hit = await db
    .select({ id: schema.savedGroupMembers.groupId })
    .from(schema.savedGroupMembers)
    .where(and(eq(schema.savedGroupMembers.userId, b), inArray(schema.savedGroupMembers.groupId, ga.map((r) => r.id))))
    .limit(1);
  return hit.length > 0;
}
