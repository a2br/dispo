import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { formatInTimeZone } from "date-fns-tz";
import { and, eq, gte, lt } from "drizzle-orm";
import { after } from "next/server";
import { z } from "zod";
import { db, dbReady, schema } from "@/db";
import type { Calendar, EventKind, User } from "@/db/schema";
import { messages } from "@/i18n/messages";
import { accessFor, hasSchedule, relationTo, type Access, type Relation } from "./access";
import { appUrl } from "./auth";
import { mergeBlocks, snapStart } from "./blocks";
import { STALE_MS, connectionsOf, eventsBetween, eventsFor, getCalendar, refreshCalendar, searchUsers, statusesFor, usersWithCalendar, type Status } from "./calendar";
import { DAY_FROM_H, DAY_TO_H, commonFree, type MemberData } from "./groupcalc";
import { invitesFor, listGroups, shareAGroup, type GroupWithMembers } from "./groups";
import { nextCommonSlots } from "./nextSlot";
import { starsOf } from "./stars";
import { occurrences, timeBlocksBetween, type CalEvent } from "./timeblocks";
import { TZ, addDays, dateInputValue, dayStartOf, fmtTime, localParts, relativeAge, zonedInstant } from "./time";

/**
 * dispo as MCP tools (/mcp), so an assistant can answer "who's free?" and "what do I have today?".
 * Read-only, and always as the signed-in person: every tool goes through the same access rules as
 * the app (settings, give to get, group-mates as free/busy), so nothing shows here that the app
 * wouldn't show them. Answers are plain English text; times are Zurich's.
 */

const INSTRUCTIONS =
  "dispo shows EPFL students' IS-Academia timetables and who among their friends is free. Everything is read-only and seen as the signed-in user, " +
  "with the app's privacy rules: some people show only as free/busy (no course names), some not at all; never guess what a tool didn't return. " +
  "Times are Europe/Zurich, 24-hour; each answer starts with the current date and time there. EPFL classes start at a quarter past (13:15) and count as busy from the full hour. " +
  "whos_free answers 'who's free now / at 14:00 / tomorrow at noon' (default: all the user's connections, plus each group's next common free time). " +
  "my_schedule is the user's own classes and blocks, schedule_of someone else's, find_time the windows when the user and others are all free, " +
  "people lists connections, requests and groups or looks someone up. Name people by first name, full name, EPFL email, or a group's name; " +
  "when a name is ambiguous the tool lists the candidates: ask the user which one they mean.";

const READ = { readOnlyHint: true, openWorldHint: false } as const;
const MAX_PEOPLE = 12;

/** A problem the assistant should relay or fix (bad date, unknown name), as opposed to a bug. */
class Ask extends Error {}

type Result = { content: { type: "text"; text: string }[]; isError?: boolean };

function guard<A>(fn: (args: A) => Promise<string>) {
  return async (args: A): Promise<Result> => {
    try {
      return { content: [{ type: "text", text: await fn(args) }] };
    } catch (e) {
      if (e instanceof Ask) return { content: [{ type: "text", text: e.message }], isError: true };
      console.error("mcp tool", e);
      return { content: [{ type: "text", text: "Something went wrong on dispo's side. Try again in a moment." }], isError: true };
    }
  };
}

// ---------- time ----------

const dayLabel = (ms: number) => formatInTimeZone(ms, TZ, "EEE d MMM yyyy");
const dayShort = (ms: number) => formatInTimeZone(ms, TZ, "EEE d MMM");
const span = (a: number, b: number) => `${fmtTime(a)}–${fmtTime(b)}`;
const isWeekend = (ms: number) => localParts(ms).day >= 5;

const DATE_HELP = 'First day: "today" (default), "tomorrow" or YYYY-MM-DD.';
const HHMM = /^([01]?\d|2[0-3]):[0-5]\d$/;

function dayFrom(s: string | undefined, now: number): number {
  const v = (s ?? "").trim().toLowerCase();
  if (!v || v === "today") return dayStartOf(now);
  if (v === "tomorrow") return addDays(dayStartOf(now), 1);
  const ms = zonedInstant(v, "00:00");
  if (ms == null) throw new Ask(`Couldn't read the date "${s}": use YYYY-MM-DD, "today" or "tomorrow".`);
  return ms;
}

/** "now", "HH:MM" (today), or a day and a time: "tomorrow 12:00", "2026-10-27 14:00". */
function instantFrom(s: string | undefined, now: number): number {
  const v = (s ?? "").trim();
  if (!v || v.toLowerCase() === "now") return now;
  const m = v.match(/^(?:(\d{4}-\d{2}-\d{2}|today|tomorrow)[ T])?(\d{1,2}):(\d{2})$/i);
  const ms = m ? zonedInstant(dateInputValue(dayFrom(m[1], now)), `${m[2].padStart(2, "0")}:${m[3]}`) : null;
  if (ms == null) throw new Ask(`Couldn't read the time "${s}": use "now", "HH:MM", or "YYYY-MM-DD HH:MM".`);
  return ms;
}

function zoned(day: number, hhmm: string): number {
  return zonedInstant(dateInputValue(day), hhmm.padStart(5, "0"))!;
}

function nowLine(now: number): string {
  return `Now: ${dayLabel(now)}, ${fmtTime(now)} (Europe/Zurich).`;
}

function rangeLabel(from: number, days: number): string {
  return days === 1 ? dayLabel(from) : `${dayShort(from)} – ${dayLabel(addDays(from, days - 1))}`;
}

function daysOf(from: number, n: number): number[] {
  return Array.from({ length: n }, (_, i) => addDays(from, i));
}

// ---------- who the viewer knows, and what they may see ----------

async function circleOf(viewer: User) {
  const [conns, groups, stars] = await Promise.all([connectionsOf(viewer.id), listGroups(viewer.id), starsOf(viewer.id)]);
  const connections = [...conns.accepted].sort((a, b) => Number(stars.users.has(b.id)) - Number(stars.users.has(a.id)) || a.name.localeCompare(b.name));
  return { conns, connections, groups, stars };
}
type Circle = Awaited<ReturnType<typeof circleOf>>;

type Seen = { user: User; access: Access; rel: Relation };

/** As the calendar decides it: both people's settings, give to get, and group-mates show as free/busy. */
async function sight(viewer: User, mine: boolean, users: User[]): Promise<Seen[]> {
  return Promise.all(
    users.map(async (user) => {
      const rel = await relationTo(viewer.id, user);
      let access = accessFor(user, rel, mine);
      if (access === "none" && mine && (await shareAGroup(viewer.id, user.id))) access = "busy";
      return { user, access, rel };
    }),
  );
}

function hiddenText(mine: boolean): string {
  return mine ? "connections only" : "give to get: hidden until the user adds their own schedule";
}

const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
const words = (s: string) => fold(s).split(/[\s.@'’-]+/).filter(Boolean);

type Pick = { kind: "group"; group: GroupWithMembers } | { kind: "person"; user: User };

const keysOf = (p: Pick) => (p.kind === "group" ? [p.group.name] : [p.user.name, p.user.email, p.user.email.split("@")[0]]);
const pickLabel = (p: Pick) => (p.kind === "group" ? `the group "${p.group.name}"` : `${p.user.name} (${p.user.email})`);

/** Exact name or email matches if there are any, else names where every word of the query starts a word. */
function matching(cands: Pick[], q: string): Pick[] {
  const exact = cands.filter((c) => keysOf(c).some((k) => fold(k) === q));
  if (exact.length) return exact;
  const qw = words(q);
  return cands.filter((c) => keysOf(c).some((k) => qw.every((w) => words(k).some((x) => x.startsWith(w)))));
}

/**
 * The people a list of names stands for. Groups and people the viewer knows (connections,
 * group-mates) come first, then anyone on dispo. A group stands for everyone in it. Unknown or
 * ambiguous names throw, listing the candidates. The viewer ("me", their own name) is left out.
 */
async function resolve(viewer: User, names: string[], c: Circle): Promise<User[]> {
  const known = new Map([...c.conns.accepted, ...c.groups.flatMap((g) => g.members)].map((u) => [u.id, u]));
  const near: Pick[] = [...c.groups.map((group) => ({ kind: "group" as const, group })), ...[...known.values()].map((user) => ({ kind: "person" as const, user }))];
  const out = new Map<string, User>();
  for (const name of names) {
    const q = fold(name);
    if (!q || ["me", "myself", "i", "you"].includes(q) || q === fold(viewer.name) || q === viewer.email) continue;
    let hits = matching(near, q);
    if (!hits.length) {
      const longest = [...words(q)].sort((a, b) => b.length - a.length)[0] ?? q;
      hits = matching((await searchUsers(viewer, longest, 20)).map((user) => ({ kind: "person" as const, user })), q);
    }
    if (!hits.length) throw new Ask(`No one on dispo matches "${name}". Try a full name or EPFL email, or look them up with the people tool.`);
    if (hits.length > 1) throw new Ask(`"${name}" could be ${hits.slice(0, 8).map(pickLabel).join(", ")}. Ask the user which one, then pass the full name or email.`);
    const h = hits[0];
    for (const u of h.kind === "group" ? h.group.members : [h.user]) out.set(u.id, u);
  }
  return [...out.values()];
}

// ---------- describing schedules ----------

/** Mirrors `statusView`: course names only with full access, notes on personal blocks only for their owner. */
function statusText(s: Status | undefined, access: Access, own = false): string {
  if (!s) return "unknown";
  switch (s.state) {
    case "unknown":
      return "no schedule on dispo";
    case "hidden":
      return s.reason === "private" ? "schedule is private" : "hidden until the user adds their own schedule";
    case "busy": {
      const e = s.event;
      const what = e.personal ? (own ? e.personal.note : null) : access === "full" ? [e.course, e.rooms].filter(Boolean).join(" · ") : null;
      return `busy until ${fmtTime(s.until)}${what ? ` (${what})` : ""}`;
    }
    case "free": {
      if (s.until == null) return "free for the rest of the day";
      const next = access === "full" && s.next && !s.next.personal ? ` (then ${s.next.course})` : "";
      return `free until ${fmtTime(s.until)}${next}`;
    }
  }
}

const KIND: Record<EventKind, string> = { lecture: "lecture", exercise: "exercises", lab: "lab", project: "project", other: "" };

/** Listed start times, so a class shows as 13:15 rather than the 13:00 that `eventsFor` snaps it to. */
async function listedStarts(userId: string, from: number, to: number): Promise<Map<number, number>> {
  await dbReady;
  const e = schema.events;
  const rows = await db.select({ id: e.id, start: e.start }).from(e).where(and(eq(e.userId, userId), lt(e.start, to), gte(e.end, from)));
  return new Map(rows.map((r) => [r.id, r.start]));
}

function eventText(e: CalEvent, own: boolean): string {
  if (e.personal) {
    if (!own) return "Busy";
    return `Own block${e.personal.note ? `: ${e.personal.note}` : ""}${e.personal.weekly ? " (weekly)" : ""}`;
  }
  const kind = KIND[e.kind];
  return `${e.course}${kind ? ` (${kind})` : ""}${[e.code, e.rooms, e.teacher]
    .filter(Boolean)
    .map((x) => ` · ${x}`)
    .join("")}`;
}

function eventStart(e: CalEvent, listed: Map<number, number>): number {
  const raw = e.personal ? undefined : listed.get(e.id);
  // The academic quarter is the only thing that moved it: show the listed time.
  return raw != null && snapStart(raw) === e.start ? raw : e.start;
}

/** Free windows of 30 min or more in the default 08:00–19:00 day, from now on. Empty string when the day is over. */
function freeLine(busy: { start: number; end: number }[], day: number, now: number): string {
  const win = { start: zoned(day, `${DAY_FROM_H}:00`), end: zoned(day, `${DAY_TO_H}:00`) };
  if (now >= win.end) return "";
  const gaps = commonFree([{ id: "", name: "", isSelf: true, hasCalendar: true, blocks: busy }], win, now);
  const range = `${String(DAY_FROM_H).padStart(2, "0")}:00–${DAY_TO_H}:00${now > win.start ? ", from now" : ""}`;
  return gaps.length ? `Free (${range}): ${gaps.map((g) => span(g.start, g.end)).join(", ")}` : `No free time (${range}).`;
}

function syncText(cal: Calendar, now: number): string {
  return `Synced ${relativeAge(cal.lastOkAt, messages.en.common.ago, now)}${cal.lastError ? "; the last refresh failed" : ""}.`;
}

/** Same as the pages: a feed older than six hours refreshes after this answer is sent. */
function refreshIfStale(cal: Calendar, now: number) {
  if (!cal.lastFetchedAt || now - cal.lastFetchedAt > STALE_MS) after(() => refreshCalendar(cal.userId));
}

async function scheduleText(viewer: User, target: User, access: Access, from: number, days: number, now: number): Promise<string> {
  const own = target.id === viewer.id;
  const cal = await getCalendar(target.id);
  if (!cal) return own ? `You haven't added your schedule to dispo yet: paste your IS-Academia calendar link at ${appUrl()}/setup.` : `${target.name} hasn't added a schedule to dispo yet.`;
  refreshIfStale(cal, now);
  const to = addDays(from, days);
  const [events, blocks, listed] = await Promise.all([
    eventsBetween(target.id, from, to),
    own ? timeBlocksBetween([viewer.id], from, to) : Promise.resolve([]),
    access === "full" ? listedStarts(target.id, from, to) : Promise.resolve(new Map<number, number>()),
  ]);
  // Only the owner sees what they skipped or cleared.
  const marks = blocks.flatMap((b) => occurrences(b, from, to)).filter((o) => o.block.kind !== "busy");

  const who = own ? "Your schedule" : `${target.name}'s schedule${access === "busy" ? " (free/busy only: they share course details with connections only)" : ""}`;
  const lines = [nowLine(now), `${who}, ${rangeLabel(from, days)}. ${syncText(cal, now)}`];
  for (const day of daysOf(from, days)) {
    const end = addDays(day, 1);
    const evs = events.filter((e) => e.start < end && e.end > day);
    const dayMarks = marks.filter((o) => o.start < end && o.end > day);
    if (!evs.length && !dayMarks.length && isWeekend(day) && days > 1) continue;
    const entries =
      access === "full"
        ? [
            ...evs.map((e) => ({ start: e.start, text: `${span(eventStart(e, listed), e.end)}  ${eventText(e, own)}` })),
            ...dayMarks.map((o) => ({
              start: o.start,
              text: `${span(o.start, o.end)}  ${o.block.kind === "skip" ? `Skipping: ${o.block.note || "a session"}` : "Marked free (clears whatever is scheduled)"}${o.block.weekly ? " (weekly)" : ""}`,
            })),
          ]
        : mergeBlocks(evs).map((b) => ({ start: b.start, text: `${span(b.start, b.end)}  Busy` }));
    lines.push("", dayLabel(day));
    if (!entries.length) lines.push("  Nothing scheduled.");
    for (const x of entries.sort((a, b) => a.start - b.start)) lines.push(`  ${x.text}`);
    const free = freeLine(mergeBlocks(evs), day, now);
    if (free) lines.push(`  ${free}`);
  }
  return lines.join("\n");
}

// ---------- server ----------

export function mcpServer(viewer: User): McpServer {
  const server = new McpServer(
    {
      name: "dispo",
      title: "dispo",
      version: "0.1.0",
      websiteUrl: appUrl(),
      icons: [
        { src: `${appUrl()}/icon.svg`, mimeType: "image/svg+xml", sizes: ["any"] },
        { src: `${appUrl()}/icon-192.png`, mimeType: "image/png", sizes: ["192x192"] },
      ],
    },
    { instructions: INSTRUCTIONS },
  );

  server.registerTool(
    "whos_free",
    {
      title: "Who's free",
      description:
        "Who is free or busy right now (or at another time) and until when. Without `who`, covers all the user's connections (starred first) and, for now, " +
        "each of their groups' next time everyone is free. Course names only appear for people whose details the user may see.",
      inputSchema: {
        who: z.array(z.string()).max(MAX_PEOPLE).optional().describe("People or groups: first names, full names, EPFL emails or group names. Default: all the user's connections."),
        at: z.string().optional().describe('When: "now" (default), "HH:MM" today, or "tomorrow 12:00" / "YYYY-MM-DD HH:MM".'),
      },
      annotations: READ,
    },
    guard(async ({ who, at }) => {
      const now = Date.now();
      const when = instantFrom(at, now);
      const c = await circleOf(viewer);
      const people = who?.length ? await resolve(viewer, who, c) : c.connections;
      const mine = await hasSchedule(viewer.id);
      const seen = await sight(viewer, mine, people);
      const visible = seen.filter((s) => s.access !== "none");
      const statuses = await statusesFor([viewer.id, ...visible.map((s) => s.user.id)], when);

      const atNow = Math.abs(when - now) < 60_000;
      const lines = [nowLine(now)];
      if (!atNow) lines.push(`Statuses at ${dayLabel(when)}, ${fmtTime(when)}.`);
      lines.push(`You: ${statusText(statuses.get(viewer.id), "full", true)}.`);
      if (!who?.length && !people.length) lines.push("", "You have no connections on dispo yet: add people in the app to see when they're free.");

      const rows = visible.map((s) => ({ ...s, status: statuses.get(s.user.id) }));
      const until = (s: Status | undefined) => (s?.state === "free" ? (s.until ?? Infinity) : s?.state === "busy" ? s.until : 0);
      const free = rows.filter((r) => r.status?.state === "free").sort((a, b) => until(b.status) - until(a.status));
      const busy = rows.filter((r) => r.status?.state === "busy").sort((a, b) => until(a.status) - until(b.status));
      const none = rows.filter((r) => r.status?.state !== "free" && r.status?.state !== "busy");
      const hidden = seen.filter((s) => s.access === "none");
      const list = (title: string, rs: typeof rows) => {
        if (!rs.length) return;
        lines.push("", `${title} (${rs.length}):`);
        for (const r of rs) lines.push(`- ${c.stars.users.has(r.user.id) ? "★ " : ""}${r.user.name}: ${statusText(r.status, r.access)}`);
      };
      list("Free", free);
      list("Busy", busy);
      if (none.length) lines.push("", `No schedule on dispo: ${none.map((r) => r.user.name).join(", ")}.`);
      if (hidden.length) lines.push("", `Can't see: ${hidden.map((s) => s.user.name).join(", ")} (${hiddenText(mine)}).`);

      if (!who?.length && atNow && c.groups.length) {
        const slots = await nextCommonSlots(
          c.groups.map((g) => ({ id: g.id, userIds: [viewer.id, ...g.members.map((m) => m.id)] })),
          now,
        );
        lines.push("", `Groups, next time everyone is free (weekdays ${String(DAY_FROM_H).padStart(2, "0")}:00–${DAY_TO_H}:00, 30 min or more):`);
        for (const g of c.groups) {
          const s = slots.get(g.id);
          const when = s ? (s.now ? `now, until ${fmtTime(s.end)}` : `${dayShort(s.start)}, ${span(s.start, s.end)}`) : "nothing in the next two weeks (or fewer than two schedules)";
          lines.push(`- ${g.name} (you${g.members.length ? `, ${g.members.map((m) => m.name).join(", ")}` : ""}): ${when}`);
        }
      }
      return lines.join("\n");
    }),
  );

  server.registerTool(
    "my_schedule",
    {
      title: "My schedule",
      description:
        "The user's own timetable: classes with rooms, course codes and teachers, their own busy blocks (with notes), skipped classes and time marked free, " +
        "plus the free windows of each day. Use it for 'what do I have today', 'when is my next class', 'am I free on Thursday afternoon'.",
      inputSchema: {
        date: z.string().optional().describe(DATE_HELP),
        days: z.number().int().min(1).max(14).optional().describe("How many days from `date` (default 1; 5 or 7 for a week)."),
      },
      annotations: READ,
    },
    guard(async ({ date, days }) => {
      const now = Date.now();
      return scheduleText(viewer, viewer, "full", dayFrom(date, now), days ?? 1, now);
    }),
  );

  server.registerTool(
    "schedule_of",
    {
      title: "Someone's schedule",
      description:
        "Another person's timetable as the user may see it: full details (courses, rooms) for connections and people who share theirs with everyone, " +
        "busy blocks only for people who share details with connections only.",
      inputSchema: {
        person: z.string().describe("First name, full name or EPFL email."),
        date: z.string().optional().describe(DATE_HELP),
        days: z.number().int().min(1).max(14).optional().describe("How many days from `date` (default 1; 5 or 7 for a week)."),
      },
      annotations: READ,
    },
    guard(async ({ person, date, days }) => {
      const now = Date.now();
      const from = dayFrom(date, now);
      const c = await circleOf(viewer);
      const found = await resolve(viewer, [person], c);
      if (found.length === 0) return scheduleText(viewer, viewer, "full", from, days ?? 1, now);
      if (found.length > 1) throw new Ask(`"${person}" is a group. Use find_time or whos_free for groups, or name one person.`);
      const mine = await hasSchedule(viewer.id);
      const [s] = await sight(viewer, mine, found);
      if (s.access === "none") {
        if (!mine) return `You only see your connections' schedules until you add your own (give to get): ${appUrl()}/setup.`;
        return `${s.user.name} only shows their schedule to their connections${s.rel.kind === "outgoing" ? "; your connection request is waiting for their answer" : s.rel.kind === "incoming" ? "; they sent you a connection request you can accept in the app" : ""}.`;
      }
      return scheduleText(viewer, s.user, s.access, from, days ?? 1, now);
    }),
  );

  server.registerTool(
    "find_time",
    {
      title: "Find a time",
      description:
        "Windows when the user and the given people (or groups) are all free, day by day. People without a schedule on dispo count as free; " +
        "people the user can't see are left out (and named). Defaults: from today, 7 days, weekdays, 08:00–19:00, 30 minutes or more.",
      inputSchema: {
        with: z.array(z.string()).min(1).max(MAX_PEOPLE).describe("People or groups: first names, full names, EPFL emails or group names."),
        date: z.string().optional().describe(DATE_HELP),
        days: z.number().int().min(1).max(14).optional().describe("How many days to look at (default 7)."),
        min_minutes: z.number().int().min(15).max(600).optional().describe("Shortest useful window in minutes (default 30)."),
        earliest: z.string().regex(HHMM, "Use HH:MM").optional().describe("Start of the day to search, HH:MM (default 08:00)."),
        latest: z.string().regex(HHMM, "Use HH:MM").optional().describe("End of the day to search, HH:MM (default 19:00)."),
        weekends: z.boolean().optional().describe("Also search Saturdays and Sundays (default false)."),
        include_me: z.boolean().optional().describe("Count the user's own schedule (default true). False for 'when are Alice and Bob both free'."),
      },
      annotations: READ,
    },
    guard(async (a) => {
      const now = Date.now();
      const from = dayFrom(a.date, now);
      const days = a.days ?? 7;
      const earliest = a.earliest ?? `${String(DAY_FROM_H).padStart(2, "0")}:00`;
      const latest = a.latest ?? `${DAY_TO_H}:00`;
      if (earliest.padStart(5, "0") >= latest.padStart(5, "0")) throw new Ask("`earliest` must be before `latest`.");
      const c = await circleOf(viewer);
      const others = await resolve(viewer, a.with, c);
      if (others.length > MAX_PEOPLE) throw new Ask(`That's ${others.length} people; dispo compares up to ${MAX_PEOPLE} at a time.`);
      const mine = await hasSchedule(viewer.id);
      const seen = await sight(viewer, mine, others);
      const hidden = seen.filter((s) => s.access === "none");
      const people = [...(a.include_me === false ? [] : [viewer]), ...seen.filter((s) => s.access !== "none").map((s) => s.user)];
      if (!people.length) return `${nowLine(now)}\nNone of them shows their schedule to the user (${hiddenText(mine)}).`;

      const to = addDays(from, days);
      const ids = people.map((u) => u.id);
      const [events, withCal] = await Promise.all([eventsFor(ids, from, to), usersWithCalendar(ids)]);
      const members: MemberData[] = people.map((u) => ({
        id: u.id,
        name: u.name,
        isSelf: u.id === viewer.id,
        hasCalendar: withCal.has(u.id),
        blocks: mergeBlocks(events.get(u.id) ?? []).map(({ start, end }) => ({ start, end })),
      }));
      const noCal = members.filter((m) => !m.hasCalendar);
      if (noCal.length === members.length) return `${nowLine(now)}\nNo one here has a schedule on dispo, so there's nothing to compare.`;
      const names = people.map((u) => (u.id === viewer.id ? "you" : u.name));
      const lines = [
        nowLine(now),
        `When ${names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} are all` : `${names[0]} ${names[0] === "you" ? "are" : "is"}`} free ` +
          `(${a.min_minutes ?? 30} min or more, ${earliest}–${latest}${a.weekends ? "" : ", weekdays"}):`,
      ];
      for (const day of daysOf(from, days)) {
        if (!a.weekends && isWeekend(day)) continue;
        const win = { start: zoned(day, earliest), end: zoned(day, latest) };
        if (win.end <= now) continue;
        const free = commonFree(members, win, now, a.min_minutes ?? 30);
        lines.push(`- ${dayShort(day)}: ${free.length ? free.map((w) => span(w.start, w.end)).join(", ") : "none"}`);
      }
      if (noCal.length) lines.push("", `No schedule on dispo, counted as free: ${noCal.map((m) => m.name).join(", ")}.`);
      if (hidden.length) lines.push("", `Left out, can't see their schedule: ${hidden.map((s) => s.user.name).join(", ")} (${hiddenText(mine)}).`);
      return lines.join("\n");
    }),
  );

  server.registerTool(
    "people",
    {
      title: "People",
      description:
        "Without `query`: the user's connections (with what they're doing now), pending connection requests, group invitations and groups. " +
        "With `query`: anyone on dispo matching a name or email, with whether they're connected and what the user can see.",
      inputSchema: {
        query: z.string().optional().describe("Name or email to look up among everyone on dispo."),
      },
      annotations: READ,
    },
    guard(async ({ query }) => {
      const now = Date.now();
      const mine = await hasSchedule(viewer.id);
      const REL: Record<Relation["kind"], string> = {
        self: "you",
        accepted: "connected",
        outgoing: "you sent a connection request",
        incoming: "sent you a connection request",
        none: "not connected",
      };
      const describe = async (users: User[], withRel: boolean) => {
        const seen = await sight(viewer, mine, users);
        const st = await statusesFor(seen.filter((s) => s.access !== "none").map((s) => s.user.id), now);
        return seen.map((s) => {
          const see = s.access === "none" ? hiddenText(mine) : `${statusText(st.get(s.user.id), s.access)}${s.access === "busy" ? " (free/busy only)" : ""}`;
          return `${s.user.name} <${s.user.email}>: ${withRel ? `${REL[s.rel.kind]}; ` : ""}${see}`;
        });
      };

      if (query?.trim()) {
        const found = await searchUsers(viewer, query, 15);
        if (!found.length) return `No one on dispo matches "${query}". Only people who signed up to dispo can be found.`;
        return [nowLine(now), `People on dispo matching "${query}":`, ...(await describe(found, true)).map((l) => `- ${l}`)].join("\n");
      }

      const c = await circleOf(viewer);
      const invites = await invitesFor(viewer.id);
      const lines = [nowLine(now), "", `Connections (${c.connections.length})${c.stars.users.size ? ", starred first" : ""}:`];
      const conn = await describe(c.connections, false);
      c.connections.forEach((u, i) => lines.push(`- ${c.stars.users.has(u.id) ? "★ " : ""}${conn[i]}`));
      if (!c.connections.length) lines.push("- none yet");
      if (c.conns.incoming.length) lines.push("", `Waiting for the user's answer (accept in the app): ${c.conns.incoming.map((u) => u.name).join(", ")}.`);
      if (c.conns.outgoing.length) lines.push("", `Requests the user sent: ${c.conns.outgoing.map((u) => u.name).join(", ")}.`);
      if (invites.length) lines.push("", "Group invitations:", ...invites.map((v) => `- ${v.inviter.name} invited the user to "${v.group.name}"`));
      lines.push("", `Groups (${c.groups.length}):`);
      for (const g of c.groups) lines.push(`- ${c.stars.groups.has(g.id) ? "★ " : ""}${g.name}: you${g.members.length ? `, ${g.members.map((m) => m.name).join(", ")}` : ""}`);
      if (!c.groups.length) lines.push("- none yet");
      return lines.join("\n");
    }),
  );

  return server;
}
