import { and, asc, eq, inArray, isNotNull, or } from "drizzle-orm";
import { db, dbReady, schema } from "@/db";
import type { SavedGroup, User } from "@/db/schema";

export const MAX_GROUP_MEMBERS = 11; // plus you = 12 columns in the grid

/** `members` is everyone in the group except the viewer (so it includes the owner for members). */
export type GroupWithMembers = SavedGroup & { members: User[]; isOwner: boolean; shared: boolean };

/**
 * Groups you own, plus shared groups (those with a share link) you've joined.
 * Private groups without a link stay visible to their owner only.
 */
export async function listGroups(viewerId: string): Promise<GroupWithMembers[]> {
  await dbReady;
  const memberOf = await db.select({ id: schema.savedGroupMembers.groupId }).from(schema.savedGroupMembers).where(eq(schema.savedGroupMembers.userId, viewerId));
  const joinedIds = memberOf.map((r) => r.id);
  const groups = await db
    .select()
    .from(schema.savedGroups)
    .where(
      joinedIds.length
        ? or(eq(schema.savedGroups.ownerId, viewerId), and(inArray(schema.savedGroups.id, joinedIds), isNotNull(schema.savedGroups.inviteCode)))
        : eq(schema.savedGroups.ownerId, viewerId),
    )
    .orderBy(asc(schema.savedGroups.name));
  if (groups.length === 0) return [];
  const rows = await db
    .select({ groupId: schema.savedGroupMembers.groupId, u: schema.users })
    .from(schema.savedGroupMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.savedGroupMembers.userId))
    .where(inArray(schema.savedGroupMembers.groupId, groups.map((g) => g.id)))
    .orderBy(asc(schema.users.name));
  const ownerIds = [...new Set(groups.map((g) => g.ownerId).filter((id) => id !== viewerId))];
  const owners = ownerIds.length ? await db.select().from(schema.users).where(inArray(schema.users.id, ownerIds)) : [];
  return groups.map((g) => {
    const isOwner = g.ownerId === viewerId;
    const members = rows.filter((r) => r.groupId === g.id && r.u.id !== viewerId).map((r) => r.u);
    const owner = owners.find((o) => o.id === g.ownerId);
    return { ...g, members: isOwner || !owner ? members : [owner, ...members], isOwner, shared: g.inviteCode != null };
  });
}

export async function getGroup(ownerId: string, id: string): Promise<GroupWithMembers | null> {
  await dbReady;
  const [g] = await db
    .select()
    .from(schema.savedGroups)
    .where(and(eq(schema.savedGroups.id, id), eq(schema.savedGroups.ownerId, ownerId)))
    .limit(1);
  if (!g) return null;
  const rows = await db
    .select({ u: schema.users })
    .from(schema.savedGroupMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.savedGroupMembers.userId))
    .where(eq(schema.savedGroupMembers.groupId, id))
    .orderBy(asc(schema.users.name));
  return { ...g, members: rows.map((r) => r.u), isOwner: true, shared: g.inviteCode != null };
}

function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, 60);
}

function cleanIds(ownerId: string, ids: string[]): string[] {
  return [...new Set(ids.map((s) => s.trim()).filter((s) => s && s !== ownerId))].slice(0, MAX_GROUP_MEMBERS);
}

export async function createGroup(ownerId: string, name: string, memberIds: string[]): Promise<string> {
  await dbReady;
  const id = crypto.randomUUID();
  await db.insert(schema.savedGroups).values({ id, ownerId, name: cleanName(name) || "Untitled group", inviteCode: null, createdAt: Date.now() });
  await setGroupMembers(ownerId, id, memberIds);
  return id;
}

export async function setGroupMembers(ownerId: string, groupId: string, memberIds: string[]): Promise<void> {
  const g = await getGroup(ownerId, groupId);
  if (!g) return;
  const ids = cleanIds(ownerId, memberIds);
  const existing = ids.length ? await db.select({ id: schema.users.id }).from(schema.users).where(inArray(schema.users.id, ids)) : [];
  await db.transaction(async (tx) => {
    await tx.delete(schema.savedGroupMembers).where(eq(schema.savedGroupMembers.groupId, groupId));
    if (existing.length) await tx.insert(schema.savedGroupMembers).values(existing.map((u) => ({ groupId, userId: u.id })));
  });
}

export async function renameGroup(ownerId: string, groupId: string, name: string): Promise<void> {
  await dbReady;
  const n = cleanName(name);
  if (!n) return;
  await db.update(schema.savedGroups).set({ name: n }).where(and(eq(schema.savedGroups.id, groupId), eq(schema.savedGroups.ownerId, ownerId)));
}

export async function deleteGroup(ownerId: string, groupId: string): Promise<void> {
  await dbReady;
  await db.delete(schema.savedGroups).where(and(eq(schema.savedGroups.id, groupId), eq(schema.savedGroups.ownerId, ownerId)));
}
