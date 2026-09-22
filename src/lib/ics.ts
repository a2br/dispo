import ical from "node-ical";
import type { EventKind } from "@/db/schema";

export type ParsedEvent = {
  uid: string;
  start: number;
  end: number;
  course: string;
  kind: EventKind;
  code: string | null;
  rooms: string | null;
  teacher: string | null;
};

const ALLOWED_HOSTS = [/(^|\.)epfl\.ch$/i, /(^|\.)pocketcampus\.org$/i];
const MAX_BYTES = 5 * 1024 * 1024;

export class IcsError extends Error {}

/** Accepts https:// or webcal:// links to an EPFL/PocketCampus host. Returns a normalized https URL. */
export function normalizeIcsUrl(input: string): string {
  let s = input.trim();
  if (!s) throw new IcsError("Paste the calendar link first.");
  if (/^webcal:\/\//i.test(s)) s = "https://" + s.slice("webcal://".length);
  if (/^http:\/\//i.test(s)) s = "https://" + s.slice("http://".length);
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    throw new IcsError("That doesn't look like a link.");
  }
  if (u.protocol !== "https:") throw new IcsError("Only https links are accepted.");
  if (!ALLOWED_HOSTS.some((re) => re.test(u.hostname))) {
    throw new IcsError("Only links from campus.epfl.ch / epfl.ch are accepted.");
  }
  if (u.port && u.port !== "443") throw new IcsError("Unexpected port in link.");
  u.port = "";
  return u.toString();
}

export async function fetchIcs(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { accept: "text/calendar, */*" },
    signal: AbortSignal.timeout(20_000),
    redirect: "manual",
    cache: "no-store",
  });
  if (res.status >= 300 && res.status < 400) throw new IcsError("The link redirected somewhere else; paste the direct calendar link.");
  if (!res.ok) throw new IcsError(`Calendar server answered ${res.status}.`);
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES) throw new IcsError("Calendar file is too large.");
  const text = await res.text();
  if (text.length > MAX_BYTES) throw new IcsError("Calendar file is too large.");
  if (!/BEGIN:VCALENDAR/.test(text)) throw new IcsError("That link didn't return a calendar.");
  return text;
}

function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && "val" in (v as Record<string, unknown>)) return String((v as { val: unknown }).val ?? "");
  return String(v);
}

const KIND_MAP: Record<string, EventKind> = {
  courses: "lecture",
  cours: "lecture",
  lecture: "lecture",
  exercises: "exercise",
  exercices: "exercise",
  lab: "lab",
  labs: "lab",
  tp: "lab",
  project: "project",
  projet: "project",
};

export function parseIcs(text: string): ParsedEvent[] {
  const data = ical.sync.parseICS(text);
  const out: ParsedEvent[] = [];
  for (const item of Object.values(data)) {
    if (!item || typeof item !== "object" || (item as { type?: string }).type !== "VEVENT") continue;
    const ev = item as import("node-ical").VEvent;
    if (!ev.start || !ev.end || ev.datetype === "date") continue;
    const summary = str(ev.summary).trim();
    const m = summary.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
    const course = (m ? m[1] : summary).trim() || "Untitled";
    const kindRaw = (m ? m[2] : "").trim().toLowerCase();
    const kind: EventKind = KIND_MAP[kindRaw] ?? "other";
    const desc = str(ev.description);
    const code = desc.match(/Course Code\s*\n\s*([A-Z]{2,6}-\d{2,4}[A-Z]?)/)?.[1] ?? null;
    const teacher = desc.match(/Teacher\s*\n\s*•\s*([^—\n]+?)\s*(?:—|$)/)?.[1]?.trim() ?? null;
    const location = str(ev.location).trim();
    const rooms = location
      ? location
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean)
          .join(", ")
      : null;
    out.push({
      uid: ev.uid,
      start: ev.start.getTime(),
      end: ev.end.getTime(),
      course,
      kind,
      code,
      rooms,
      teacher,
    });
  }
  out.sort((a, b) => a.start - b.start);
  return out;
}
