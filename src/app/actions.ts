"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, dbReady, schema } from "@/db";
import type { Visibility } from "@/db/schema";
import { appUrl, destroySession, getUser, requireUser, safeNext } from "@/lib/auth";
import { ensureGroupInviteCode, leaveGroup } from "@/lib/invites";
import { setStar } from "@/lib/stars";
import { connectCalendar, disconnectCalendar, refreshCalendar } from "@/lib/calendar";
import { IcsError } from "@/lib/ics";
import { connectionBetween } from "@/lib/access";
import { createGroup, deleteGroup, renameGroup } from "@/lib/groups";

export type FormState = { error?: string; ok?: string } | undefined;

export async function saveCalendarLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const url = String(formData.get("url") ?? "");
  let count: number;
  try {
    ({ count } = await connectCalendar(user.id, url));
  } catch (e) {
    if (e instanceof IcsError) return { error: e.message };
    console.error("connectCalendar failed", e);
    return { error: "Couldn't fetch that calendar. Check the link and try again." };
  }
  revalidatePath("/", "layout");
  if (formData.get("then") === "stay") return { ok: `Loaded ${count} sessions.` };
  // redirect() works by throwing, so it must stay outside the try/catch above.
  redirect(safeNext(String(formData.get("next") ?? "")) ?? "/calendar");
}

export async function refreshMyCalendar(): Promise<void> {
  const user = await requireUser();
  await refreshCalendar(user.id);
  revalidatePath("/", "layout");
}

export async function removeMyCalendar(): Promise<void> {
  const user = await requireUser();
  await disconnectCalendar(user.id);
  revalidatePath("/", "layout");
}

export async function setVisibility(formData: FormData): Promise<void> {
  const user = await requireUser();
  const v = String(formData.get("visibility"));
  if (v !== "everyone" && v !== "connections" && v !== "private") return;
  await dbReady;
  await db.update(schema.users).set({ visibility: v as Visibility }).where(eq(schema.users.id, user.id));
  revalidatePath("/", "layout");
}

export async function setDiscoverable(formData: FormData): Promise<void> {
  const user = await requireUser();
  await dbReady;
  await db.update(schema.users).set({ discoverable: formData.get("discoverable") === "on" }).where(eq(schema.users.id, user.id));
  revalidatePath("/", "layout");
}

export type PhoneState = { error?: string; ok?: string } | undefined;

/** Optional phone number for classmates and connections. Empty clears it. */
export async function setPhone(_prev: PhoneState, formData: FormData): Promise<PhoneState> {
  const user = await requireUser();
  const raw = String(formData.get("phone") ?? "").trim();
  const phone = raw.replace(/[^\d+ ]/g, "").replace(/\s+/g, " ").trim();
  if (phone && !/^\+?[\d ]{7,20}$/.test(phone)) return { error: "That doesn’t look like a phone number." };
  await dbReady;
  await db.update(schema.users).set({ phone: phone || null }).where(eq(schema.users.id, user.id));
  revalidatePath("/", "layout");
  return { ok: phone ? "Saved" : "Removed" };
}

export async function requestConnection(formData: FormData): Promise<void> {
  const user = await requireUser();
  const target = String(formData.get("userId") ?? "");
  if (!target || target === user.id) return;
  await dbReady;
  const existing = await connectionBetween(user.id, target);
  if (existing) {
    // If they already asked me, accept instead.
    if (existing.status === "pending" && existing.requesterId === target) {
      await db
        .update(schema.connections)
        .set({ status: "accepted" })
        .where(and(eq(schema.connections.requesterId, target), eq(schema.connections.addresseeId, user.id)));
    }
  } else {
    await db.insert(schema.connections).values({ requesterId: user.id, addresseeId: target, status: "pending", createdAt: Date.now() });
  }
  revalidatePath("/", "layout");
}

export async function acceptConnection(formData: FormData): Promise<void> {
  const user = await requireUser();
  const requester = String(formData.get("userId") ?? "");
  await dbReady;
  await db
    .update(schema.connections)
    .set({ status: "accepted" })
    .where(and(eq(schema.connections.requesterId, requester), eq(schema.connections.addresseeId, user.id), eq(schema.connections.status, "pending")));
  revalidatePath("/", "layout");
}

/** Decline a request, cancel my own request, or remove an accepted connection. */
export async function removeConnection(formData: FormData): Promise<void> {
  const user = await requireUser();
  const other = String(formData.get("userId") ?? "");
  await dbReady;
  await db
    .delete(schema.connections)
    .where(and(eq(schema.connections.requesterId, user.id), eq(schema.connections.addresseeId, other)));
  await db
    .delete(schema.connections)
    .where(and(eq(schema.connections.requesterId, other), eq(schema.connections.addresseeId, user.id)));
  revalidatePath("/", "layout");
}

export async function signOut(): Promise<void> {
  if (await getUser()) await destroySession();
  redirect("/");
}

// ---------- saved groups ----------


export async function createGroupAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "");
  const members = String(formData.get("members") ?? "").split(",");
  const gid = await createGroup(user.id, name, members);
  await setStar(user.id, "group", gid, true);
  revalidatePath("/", "layout");
  redirect(`/calendar?with=${members.filter(Boolean).join(",")}`);
}

export async function renameGroupAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await renameGroup(user.id, String(formData.get("groupId") ?? ""), String(formData.get("name") ?? ""));
  revalidatePath("/", "layout");
}

export async function deleteGroupAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await deleteGroup(user.id, String(formData.get("groupId") ?? ""));
  revalidatePath("/", "layout");
  // Stay on the same view: deleting the shortcut doesn't change who you're looking at.
  const members = String(formData.get("members") ?? "");
  redirect(`/calendar${members ? `?with=${members}` : ""}`);
}

// ---------- stars ----------

export async function setStarAction(kind: "user" | "group", targetId: string, on: boolean): Promise<void> {
  const user = await requireUser();
  if (kind !== "user" && kind !== "group") return;
  await setStar(user.id, kind, targetId, on);
  revalidatePath("/", "layout");
}

// ---------- invites & shared groups ----------

/** Mint (or reuse) a group's share link. Owner only; returns the full URL. */
export async function groupShareUrl(groupId: string): Promise<string | null> {
  const user = await requireUser();
  const code = await ensureGroupInviteCode(user.id, groupId);
  revalidatePath("/", "layout");
  return code ? `${appUrl()}/g/${code}` : null;
}

/** New group made to be shared in a group chat: create it with a link and open its page. */
export async function createGroupLinkAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = await createGroup(user.id, String(formData.get("name") ?? ""), []);
  await setStar(user.id, "group", id, true);
  const code = await ensureGroupInviteCode(user.id, id);
  revalidatePath("/", "layout");
  redirect(code ? `/g/${code}` : "/calendar");
}

export async function leaveGroupAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await leaveGroup(user, String(formData.get("groupId") ?? ""));
  revalidatePath("/", "layout");
  redirect("/calendar");
}
