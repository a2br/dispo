import type { Event, User } from "@/db/schema";
import type { Status } from "./calendar";
import type { Block } from "./blocks";
import { fmtTime } from "./time";

export type StatusView = { state: "busy" | "free" | "unknown"; label: string; detail?: string };

export function statusView(s: Status, access: "full" | "busy" | "none" = "busy"): StatusView {
  switch (s.state) {
    case "unknown":
      return { state: "unknown", label: "No schedule yet" };
    case "busy":
      return {
        state: "busy",
        label: `Busy until ${fmtTime(s.until)}`,
        detail: access === "full" ? [s.event.course, s.event.rooms].filter(Boolean).join(" · ") : undefined,
      };
    case "free":
      if (s.until == null) return { state: "free", label: "Free for the rest of the day" };
      return {
        state: "free",
        label: `Free until ${fmtTime(s.until)}`,
        detail: access === "full" && s.next ? `then ${s.next.course}` : undefined,
      };
  }
}

export type PersonView = { id: string; name: string; email: string; image: string | null; status: StatusView };

export function publicPerson(u: User, s: Status): PersonView {
  return { id: u.id, name: u.name, email: u.email, image: u.image, status: statusView(s, "busy") };
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
};

export function eventView(e: Event): EventView {
  return { id: e.id, start: e.start, end: e.end, title: e.course, kind: e.kind, code: e.code, rooms: e.rooms, teacher: e.teacher, masked: false };
}

/** Free/busy view: merged blocks only, so the number and length of individual sessions don't leak. */
export function busyViews(blocks: Block[]): EventView[] {
  return blocks.map((b, i) => ({ id: -(i + 1), start: b.start, end: b.end, title: "Busy", kind: "other", code: null, rooms: null, teacher: null, masked: true }));
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

/** Stable pastel hue per course name. */
export function hueFor(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}
