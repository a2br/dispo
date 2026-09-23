import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireUser } from "@/lib/auth";
import { starsOf } from "@/lib/stars";
import { accessFor, hasSchedule, relationTo } from "@/lib/access";
import { STALE_MS, connectionsOf, eventsBetween, getCalendar, getUserById, refreshCalendar, statusFrom } from "@/lib/calendar";
import { mergeBlocks } from "@/lib/blocks";
import { getGroup, listGroups, shareAGroup } from "@/lib/groups";
import type { MemberData } from "@/lib/groupcalc";
import { eventView, statusView } from "@/lib/present";
import { addDays, dayStartOf, nowMs, relativeAge, todayIndexInWeek, weekParam, weekStartFromParam, weekStartOf } from "@/lib/time";
import { PeoplePicker } from "@/components/PeoplePicker";
import { GroupWeek } from "@/components/GroupWeek";
import { StatusPill } from "@/components/StatusPill";
import { WeekView } from "@/components/WeekView";
import { WeekNav } from "@/components/WeekNav";
import { button } from "@/lib/ui";

export const metadata: Metadata = { title: "Calendar" };

const MAX_MEMBERS = 12;

/**
 * One calendar, Google Calendar style: on its own it's your week; add people or open a
 * saved group and it becomes a side-by-side free/busy comparison with suggested slots.
 */
export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const viewer = await requireUser();
  const sp = await searchParams;
  const w = typeof sp.w === "string" ? sp.w : undefined;
  const requested = typeof sp.with === "string" ? sp.with.split(",").map((s) => s.trim()).filter(Boolean) : [];

  // Old links carried a group id; the view is now described only by who is in it.
  if (typeof sp.g === "string" && requested.length === 0) {
    const legacy = await getGroup(viewer.id, sp.g);
    const params = new URLSearchParams();
    const others = legacy?.people.filter((p) => p.id !== viewer.id) ?? [];
    if (others.length) params.set("with", others.map((p) => p.id).join(","));
    if (w) params.set("w", w);
    redirect(`/calendar${params.size ? `?${params}` : ""}`);
  }
  const weekStart = weekStartFromParam(w);
  const weekEnd = addDays(weekStart, 7);
  const now = nowMs();

  // You are always in the view; everyone else must be visible to you at least as free/busy.
  const ids = [viewer.id, ...requested.filter((id) => id !== viewer.id)].filter((id, i, a) => a.indexOf(id) === i).slice(0, MAX_MEMBERS);
  const members: MemberData[] = [];
  const mine = await hasSchedule(viewer.id);
  let hiddenCount = 0; // people left out because you haven't added your schedule (or they're private)
  for (const id of ids) {
    const user = id === viewer.id ? viewer : await getUserById(id);
    if (!user) continue;
    if (id !== viewer.id) {
      const rel = await relationTo(viewer.id, user);
      const ok = accessFor(user, rel, mine) !== "none" || (mine && (await shareAGroup(viewer.id, user.id)));
      if (!ok) {
        hiddenCount++;
        continue;
      }
    }
    const cal = await getCalendar(user.id);
    const blocks = cal ? mergeBlocks(await eventsBetween(user.id, weekStart, weekEnd)).map(({ start, end }) => ({ start, end })) : [];
    members.push({ id: user.id, name: user.name, isSelf: user.id === viewer.id, hasCalendar: Boolean(cal), blocks });
  }

  const [conns, groups, stars] = await Promise.all([connectionsOf(viewer.id), listGroups(viewer.id), starsOf(viewer.id)]);
  const friends = conns.accepted
    .map((u) => ({ id: u.id, name: u.name }))
    .sort((a, b) => Number(stars.users.has(b.id)) - Number(stars.users.has(a.id)) || a.name.localeCompare(b.name));
  const selected = members.filter((m) => !m.isSelf).map((m) => ({ id: m.id, name: m.name }));
  const comparing = selected.length > 0;
  const baseParams: Record<string, string> = selected.length ? { with: selected.map((m) => m.id).join(",") } : {};
  const pickerGroups = groups
    .map((g) => ({ id: g.id, name: g.name, memberIds: g.members.map((m) => m.id) }))
    .sort((a, b) => Number(stars.groups.has(b.id)) - Number(stars.groups.has(a.id)) || a.name.localeCompare(b.name));
  // Which group (if any) this view is: exactly its people, however you got here.
  const match = selected.length
    ? groups.find((g) => g.members.length === selected.length && g.members.every((m) => selected.some((s) => s.id === m.id)))
    : undefined;
  const weekHref = (ws: number) => `/calendar?${new URLSearchParams({ ...baseParams, w: weekParam(ws) })}`;
  const todayIdx = todayIndexInWeek(weekStart, now);

  // Solo view: your own week with full details.
  const myCal = comparing ? null : await getCalendar(viewer.id);
  if (myCal && (!myCal.lastFetchedAt || now - myCal.lastFetchedAt > STALE_MS)) after(() => refreshCalendar(viewer.id));
  const [myWeek, myToday] = myCal
    ? await Promise.all([eventsBetween(viewer.id, weekStart, weekEnd), eventsBetween(viewer.id, dayStartOf(now), dayStartOf(now) + 86_400_000)])
    : [[], []];

  // Fills the screen exactly (minus the phone's bottom bar), so the calendar never needs page scrolling.
  return (
    <main className="flex flex-col h-[calc(100dvh-var(--nav-h))] py-4 md:py-8 gap-3">
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1 shrink-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">Calendar</h1>
        </div>
        <WeekNav weekStart={weekStart} thisWeekStart={weekStartOf(now)} hrefFor={weekHref} />
        {!comparing && myCal && (
          <div className="basis-full">
            <StatusPill status={statusView(statusFrom(myToday, now), "full")} />
          </div>
        )}
      </header>

      <div className="shrink-0 space-y-2">
        <PeoplePicker me={{ id: viewer.id, name: viewer.name }} friends={friends} selected={selected} groups={pickerGroups} week={w ? weekParam(weekStart) : null} />
        {hiddenCount > 0 && (
          <p className="text-sm text-muted">
            {hiddenCount === 1 ? "1 person isn’t shown" : `${hiddenCount} people aren’t shown`}:{" "}
            {mine ? "their schedule is private." : (
              <>
                add <Link href="/setup?next=%2Fcalendar" className="link">your schedule</Link> to compare with people you’re not connected with.
              </>
            )}
          </p>
        )}
        {/* Looking stays silent: the calendar never offers to create a group, it only links to one you're in. */}
        {match && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link href={`/groups/${match.id}`} className={button("secondary", "sm")}>
              <span className="text-muted font-normal">★</span> {match.name}
              <span className="text-muted font-normal">· group page</span>
            </Link>
          </div>
        )}
      </div>

      {comparing ? (
        <GroupWeek weekStart={weekStart} now={now} todayIndex={todayIdx} members={members} />
      ) : myCal ? (
        <>
          <WeekView weekStart={weekStart} events={myWeek.map(eventView)} todayIndex={todayIdx} now={now} masked={false} />
          <p className="shrink-0 text-[11px] text-muted text-center">
            Synced {relativeAge(myCal.lastOkAt, now)}
            {myCal.lastError ? " · last refresh failed" : ""} · <Link href="/me" className="link">manage in Settings</Link>
          </p>
        </>
      ) : (
        <div className="border border-line px-4 py-10 text-center space-y-3">
          <p className="text-muted">Add your schedule to see your week here, then add friends to find a time together.</p>
          <Link href="/setup" className={button("primary")}>Add my schedule</Link>
        </div>
      )}
    </main>
  );
}
