import type { Event, TimeBlockKind, User } from "@/db/schema";
import type { Status } from "./calendar";
import type { Block } from "./blocks";
import type { CalEvent, Occurrence } from "./timeblocks";
import { fmtTime } from "./time";
import type { Messages } from "@/i18n/messages";

export type StatusView = { state: "busy" | "free" | "unknown"; label: string; detail?: string };

/** `t` is the reader's messages: labels are worded for whoever looks at the status. */
export function statusView(s: Status, t: Messages, access: "full" | "busy" | "none" = "busy"): StatusView {
  switch (s.state) {
    case "unknown":
      return { state: "unknown", label: t.status.noSchedule };
    case "hidden":
      return { state: "unknown", label: s.reason === "private" ? t.status.private : t.status.giveToGet };
    case "busy":
      return {
        state: "busy",
        label: t.status.busyUntil(fmtTime(s.until)),
        // Notes on personal blocks are for their owner: others only learn "busy".
        detail: access === "full" && !s.event.personal ? [s.event.course, s.event.rooms].filter(Boolean).join(" · ") : undefined,
      };
    case "free":
      if (s.until == null) return { state: "free", label: t.status.freeRestOfDay };
      return {
        state: "free",
        label: t.status.freeUntil(fmtTime(s.until)),
        detail: access === "full" && s.next && !s.next.personal ? t.status.then(s.next.course) : undefined,
      };
  }
}

export type PersonView = { id: string; name: string; email: string; status: StatusView };

export function publicPerson(u: User, s: Status, t: Messages): PersonView {
  return { id: u.id, name: u.name, email: u.email, status: statusView(s, t, "busy") };
}

/** Event as sent to the client, reduced to free/busy when access is limited. */
export type EventView = {
  id: number;
  start: number;
  end: number;
  title: string;
  kind: Event["kind"];
  code: string | null;
  rooms: string | null;
  teacher: string | null;
  masked: boolean;
  /** A personal busy block: drawn apart from classes, titled with its note (own view) or "Busy". */
  personal?: boolean;
  /** Own view only: the time block behind this entry, so it can be changed. */
  block?: { id: string; kind: TimeBlockKind; weekly: boolean };
};

/**
 * Detailed event for display (starts already follow the academic quarter). `own` is the owner's
 * view: only they see the notes on their busy blocks, and only they can change them.
 */
export function eventView(e: CalEvent, own = false): EventView {
  const base = { id: e.id, start: e.start, end: e.end, kind: e.kind, code: e.code, rooms: e.rooms, teacher: e.teacher, masked: false };
  if (!e.personal) return { ...base, title: e.course };
  return {
    ...base,
    title: own ? (e.personal.note ?? "") : "",
    personal: true,
    block: own ? { id: e.personal.blockId, kind: "busy", weekly: e.personal.weekly } : undefined,
  };
}

/**
 * The owner's free blocks and skipped sessions, drawn as outlines over the week so they can see and
 * undo them. A skip's title is what was skipped.
 */
export function freeViews(occ: Occurrence[]): EventView[] {
  return occ
    .filter((o) => o.block.kind !== "busy")
    .map((o, i) => ({
      id: -100_000 - i,
      start: o.start,
      end: o.end,
      title: o.block.kind === "skip" ? (o.block.note ?? "") : "",
      kind: "other" as Event["kind"],
      code: null,
      rooms: null,
      teacher: null,
      masked: false,
      block: { id: o.block.id, kind: o.block.kind, weekly: o.block.weekly },
    }));
}

/** Free/busy view: merged blocks only, so the number and length of individual sessions don't leak. */
export function busyViews(blocks: Block[], t: Messages): EventView[] {
  return blocks.map((b, i) => ({ id: -(i + 1), start: b.start, end: b.end, title: t.status.busy, kind: "other", code: null, rooms: null, teacher: null, masked: true }));
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

/**
 * EPFL palette used for course and avatar colours: canard, léman, taupe and
 * Elements' info / warning / success. Groseille is left out: a red course would read as "busy".
 */
const PALETTE = ["#007480", "#00A79F", "#413D3A", "#4A90E2", "#F5A623", "#5FA31A"];

export type Tone = { base: string; bg: string; border: string; text: string };

export function toneFor(s: string): Tone {
  const base = PALETTE[hueFor(s) % PALETTE.length];
  return {
    base,
    bg: `color-mix(in oklab, ${base} 13%, var(--surface))`,
    border: `color-mix(in oklab, ${base} 55%, var(--surface))`,
    text: `color-mix(in oklab, ${base} 62%, var(--foreground))`,
  };
}

/** Stable hash per name (used to pick a palette colour). */
export function hueFor(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}
