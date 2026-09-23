"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, dbReady, schema } from "@/db";
import type { Visibility } from "@/db/schema";
import { destroySession, getUser, requireUser, safeNext } from "@/lib/auth";
import { setStar } from "@/lib/stars";
import { newCode } from "@/lib/codes";
import { connectCalendar, disconnectCalendar, refreshCalendar } from "@/lib/calendar";
import { IcsError, icsErrorText } from "@/lib/ics";
import { connectionBetween } from "@/lib/access";
import { isLocale } from "@/i18n/config";
import { getT, rememberLocale } from "@/i18n/server";
import { addMembers, answerInvite, cancelInvite, createGroup, deleteGroup, leaveGroup, renameGroup } from "@/lib/groups";

export type FormState = { error?: string; ok?: string } | undefined;

export async function saveCalendarLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const t = await getT();
  const url = String(formData.get("url") ?? "");
  let count: number;
  try {
    ({ count } = await connectCalendar(user.id, url));
  } catch (e) {
    if (e instanceof IcsError) return { error: icsErrorText(e.key, t.setup.errors) };
    console.error("connectCalendar failed", e);
    return { error: t.setup.form.failed };
  }
  revalidatePath("/", "layout");
  if (formData.get("then") === "stay") return { ok: t.setup.form.loaded(count) };
  // redirect() works by throwing, so it must stay outside the try/catch above.
  redirect(safeNext(String(formData.get("next") ?? "")) ?? "/");
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
  const t = await getT();
  const raw = String(formData.get("phone") ?? "").trim();
  const phone = raw.replace(/[^\d+ ]/g, "").replace(/\s+/g, " ").trim();
  if (phone && !/^\+?[\d ]{7,20}$/.test(phone)) return { error: t.me.phone.invalid };
  await dbReady;
  await db.update(schema.users).set({ phone: phone || null }).where(eq(schema.users.id, user.id));
  revalidatePath("/", "layout");
  return { ok: phone ? t.me.phone.saved : t.me.phone.removed };
}

/** Turn the public view-only link on (fresh code, which also revokes any old link) or off. */
export async function setPublicLink(formData: FormData): Promise<void> {
  const user = await requireUser();
  const on = formData.get("on") === "1";
  await dbReady;
  await db.update(schema.users).set({ shareCode: on ? newCode(10) : null }).where(eq(schema.users.id, user.id));
  revalidatePath("/", "layout");
}

/** Pick a language: saved on the account when signed in, and on this browser either way. */
export async function setLanguage(formData: FormData): Promise<void> {
  const locale = formData.get("locale");
  if (!isLocale(locale)) return;
  await rememberLocale(locale);
  const user = await getUser();
  if (user) {
    await dbReady;
    await db.update(schema.users).set({ locale }).where(eq(schema.users.id, user.id));
  }
  revalidatePath("/", "layout");
}

export async function dismissInviteCard(): Promise<void> {
  const user = await requireUser();
  await dbReady;
  await db.update(schema.users).set({ hideInviteCard: true }).where(eq(schema.users.id, user.id));
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

// ---------- stars ----------

export async function setStarAction(kind: "user" | "group", targetId: string, on: boolean): Promise<void> {
  const user = await requireUser();
  if (kind !== "user" && kind !== "group") return;
  await setStar(user.id, kind, targetId, on);
  revalidatePath("/", "layout");
}

// ---------- groups (group-chat style: shared with every member) ----------

/** "Create group": you + the people you picked; opens the group's page. */
export async function createGroupAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const members = formData.getAll("member").map(String);
  const { id } = await createGroup(user.id, String(formData.get("name") ?? ""), members);
  await setStar(user.id, "group", id, true);
  revalidatePath("/", "layout");
  redirect(`/groups/${id}?created=1`);
}

export async function addMembersAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const groupId = String(formData.get("groupId") ?? "");
  await addMembers(user.id, groupId, formData.getAll("member").map(String));
  revalidatePath("/", "layout");
  redirect(`/groups/${groupId}`);
}

export async function answerInviteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const groupId = String(formData.get("groupId") ?? "");
  const accepted = await answerInvite(user.id, groupId, formData.get("accept") === "1");
  if (accepted) await setStar(user.id, "group", groupId, true);
  revalidatePath("/", "layout");
  if (accepted) redirect(`/groups/${groupId}`);
}

export async function cancelInviteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const groupId = String(formData.get("groupId") ?? "");
  await cancelInvite(user.id, groupId, String(formData.get("userId") ?? ""));
  revalidatePath("/", "layout");
}

export async function renameGroupAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await renameGroup(user.id, String(formData.get("groupId") ?? ""), String(formData.get("name") ?? ""));
  revalidatePath("/", "layout");
}

export async function leaveGroupAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await leaveGroup(user.id, String(formData.get("groupId") ?? ""));
  revalidatePath("/", "layout");
  redirect("/");
}

export async function deleteGroupAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await deleteGroup(user.id, String(formData.get("groupId") ?? ""));
  revalidatePath("/", "layout");
  redirect("/");
}
