"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, dbReady, schema } from "@/db";
import type { Visibility } from "@/db/schema";
import { destroySession, getUser, requireUser } from "@/lib/auth";
import { connectCalendar, disconnectCalendar, refreshCalendar } from "@/lib/calendar";
import { IcsError } from "@/lib/ics";
import { connectionBetween } from "@/lib/access";
import { createGroup, deleteGroup, renameGroup, setGroupMembers } from "@/lib/groups";

export type FormState = { error?: string; ok?: string } | undefined;

export async function saveCalendarLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const url = String(formData.get("url") ?? "");
  try {
    const { count } = await connectCalendar(user.id, url);
    revalidatePath("/", "layout");
    if (formData.get("then") === "stay") return { ok: `Loaded ${count} sessions.` };
  } catch (e) {
    if (e instanceof IcsError) return { error: e.message };
    console.error("connectCalendar failed", e);
    return { error: "Couldn't fetch that calendar. Check the link and try again." };
  }
  redirect(`/u/${user.id}`);
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
  const id = await createGroup(user.id, name, members);
  revalidatePath("/", "layout");
  redirect(`/calendar?g=${id}`);
}

/** Called from the picker while a saved group is open: edits apply to the group directly. */
export async function setGroupMembersAction(groupId: string, memberIds: string[]): Promise<void> {
  const user = await requireUser();
  await setGroupMembers(user.id, groupId, memberIds);
  revalidatePath("/", "layout");
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
  redirect("/calendar");
}
