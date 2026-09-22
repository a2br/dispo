import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { requireUser } from "@/lib/auth";
import { accessFor, relationTo } from "@/lib/access";
import { STALE_MS, connectionsOf, eventsBetween, getCalendar, getUserById, refreshCalendar, statusFrom } from "@/lib/calendar";
import { mergeBlocks } from "@/lib/blocks";
import { getGroup, listGroups } from "@/lib/groups";
import type { MemberData } from "@/lib/groupcalc";
import { eventView, statusView } from "@/lib/present";
import { addDays, dayStartOf, fmtWeekLabel, isoDate, nowMs, relativeAge, todayIndexInWeek, weekStartFromParam } from "@/lib/time";
import { GroupPicker } from "@/components/GroupPicker";
import { GroupTitle } from "@/components/GroupTitle";
import { GroupWeek } from "@/components/GroupWeek";
import { SaveGroupForm } from "@/components/SaveGroupForm";
import { StatusPill } from "@/components/StatusPill";
import { WeekView } from "@/components/WeekView";

export const metadata: Metadata = { title: "Calendar" };

const MAX_MEMBERS = 12;

/**
 * One calendar, Google Calendar style: on its own it's your week; add people or open a
 * saved group and it becomes a side-by-side free/busy comparison with suggested slots.
 */
export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const viewer = await requireUser();
  const sp = await searchParams;
  const groupId = typeof sp.g === "string" ? sp.g : null;
  const group = groupId ? await getGroup(viewer.id, groupId) : null;
  if (groupId && !group) notFound();

  const requested = group ? group.members.map((m) => m.id) : typeof sp.with === "string" ? sp.with.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const weekParam = typeof sp.w === "string" ? sp.w : undefined;
  const weekStart = weekStartFromParam(weekParam);
  const weekEnd = addDays(weekStart, 7);
  const now = nowMs();

  // You are always in the view; everyone else must be visible to you at least as free/busy.
  const ids = [viewer.id, ...requested.filter((id) => id !== viewer.id)].filter((id, i, a) => a.indexOf(id) === i).slice(0, MAX_MEMBERS);
  const members: MemberData[] = [];
  for (const id of ids) {
    const user = id === viewer.id ? viewer : await getUserById(id);
    if (!user) continue;
    if (id !== viewer.id && accessFor(user, await relationTo(viewer.id, user)) === "none") continue;
    const cal = await getCalendar(user.id);
    const blocks = cal ? mergeBlocks(await eventsBetween(user.id, weekStart, weekEnd)).map(({ start, end }) => ({ start, end })) : [];
    members.push({ id: user.id, name: user.name, image: user.image, isSelf: user.id === viewer.id, hasCalendar: Boolean(cal), blocks });
  }

  const [conns, groups] = await Promise.all([connectionsOf(viewer.id), listGroups(viewer.id)]);
  const friends = conns.accepted.map((u) => ({ id: u.id, name: u.name, image: u.image }));
  const selected = members.filter((m) => !m.isSelf).map((m) => ({ id: m.id, name: m.name, image: m.image }));
  const comparing = selected.length > 0 || group !== null;
  const baseParams: Record<string, string> = group ? { g: group.id } : selected.length ? { with: selected.map((m) => m.id).join(",") } : {};
  const weekHref = (w: number) => `/calendar?${new URLSearchParams({ ...baseParams, w: isoDate(w) })}`;
  const todayIdx = todayIndexInWeek(weekStart, now);

  // Solo view: your own week with full details.
  const myCal = comparing ? null : await getCalendar(viewer.id);
  if (myCal && (!myCal.lastFetchedAt || now - myCal.lastFetchedAt > STALE_MS)) after(() => refreshCalendar(viewer.id));
  const [myWeek, myToday] = myCal
    ? await Promise.all([eventsBetween(viewer.id, weekStart, weekEnd), eventsBetween(viewer.id, dayStartOf(now), dayStartOf(now) + 86_400_000)])
    : [[], []];

  return (
    <main className="py-6 md:py-10 space-y-5">
      <header className="space-y-1">
        {group ? (
          <>
            <Link href="/calendar" className="text-sm text-accent">‹ My calendar</Link>
            <GroupTitle groupId={group.id} name={group.name} />
          </>
        ) : (
          <>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Calendar</h1>
            {comparing ? (
              <p className="text-sm text-muted">Everyone’s free/busy side by side. Course names stay private here.</p>
            ) : myCal ? (
              <StatusPill status={statusView(statusFrom(myToday, now), "full")} />
            ) : null}
          </>
        )}
      </header>

      <div className="space-y-2">
        <GroupPicker friends={friends} selected={selected} week={weekParam ?? null} groupId={group?.id ?? null} />
        {!group && (groups.length > 0 || selected.length > 0) && (
          <div className="flex flex-wrap items-center gap-2">
            {groups.map((g) => (
              <Link
                key={g.id}
                href={`/calendar?g=${g.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium active:opacity-70 hover:border-foreground/25"
              >
                <span className="text-muted">★</span>
                {g.name}
                <span className="text-xs text-muted tabular-nums">{g.members.length + 1}</span>
              </Link>
            ))}
            {selected.length > 0 && <SaveGroupForm memberIds={selected.map((m) => m.id)} suggestion={selected.map((m) => m.name.split(" ")[0]).join(", ")} />}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Link href={weekHref(addDays(weekStart, -7))} aria-label="Previous week" className="size-10 grid place-items-center rounded-full bg-surface border border-line active:opacity-70">‹</Link>
        <div className="text-center">
          <div className="font-semibold">{fmtWeekLabel(weekStart)}</div>
          {todayIdx == null && <Link href={weekHref(now)} className="text-xs text-accent">Back to this week</Link>}
        </div>
        <Link href={weekHref(addDays(weekStart, 7))} aria-label="Next week" className="size-10 grid place-items-center rounded-full bg-surface border border-line active:opacity-70">›</Link>
      </div>

      {comparing ? (
        selected.length === 0 ? (
          <div className="rounded-2xl bg-surface border border-line px-4 py-8 text-center text-sm text-muted">This group is empty. Add people above.</div>
        ) : (
          <GroupWeek weekStart={weekStart} now={now} todayIndex={todayIdx} members={members} />
        )
      ) : myCal ? (
        <>
          <WeekView weekStart={weekStart} events={myWeek.map(eventView)} todayIndex={todayIdx} now={now} basePath="/calendar" masked={false} hideNav />
          <p className="text-[11px] text-muted text-center">
            Synced {relativeAge(myCal.lastOkAt, now)}
            {myCal.lastError ? " · last refresh failed" : ""} · <Link href="/me" className="underline underline-offset-2">manage in Settings</Link>
          </p>
        </>
      ) : (
        <div className="rounded-2xl bg-surface border border-line px-4 py-10 text-center space-y-3">
          <p className="text-muted">Add your schedule to see your week here, then add friends to find a time together.</p>
          <Link href="/setup" className="inline-block rounded-full bg-accent text-white px-5 py-2.5 font-semibold">Add my schedule</Link>
        </div>
      )}
    </main>
  );
}
