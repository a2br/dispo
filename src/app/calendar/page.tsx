import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { appUrl, requireUser } from "@/lib/auth";
import { starsOf } from "@/lib/stars";
import { accessFor, relationTo } from "@/lib/access";
import { STALE_MS, connectionsOf, eventsBetween, getCalendar, getUserById, refreshCalendar, statusFrom } from "@/lib/calendar";
import { mergeBlocks } from "@/lib/blocks";
import { getGroup, listGroups } from "@/lib/groups";
import type { MemberData } from "@/lib/groupcalc";
import { eventView, statusView } from "@/lib/present";
import { addDays, dayStartOf, isoDate, nowMs, relativeAge, todayIndexInWeek, weekStartFromParam, weekStartOf } from "@/lib/time";
import { GroupPicker } from "@/components/GroupPicker";
import { GroupWeek } from "@/components/GroupWeek";
import { SaveGroupForm } from "@/components/SaveGroupForm";
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
  const weekParam = typeof sp.w === "string" ? sp.w : undefined;
  const requested = typeof sp.with === "string" ? sp.with.split(",").map((s) => s.trim()).filter(Boolean) : [];

  // Old links carried a group id; the view is now described only by who is in it.
  if (typeof sp.g === "string" && requested.length === 0) {
    const legacy = await getGroup(viewer.id, sp.g);
    const params = new URLSearchParams();
    if (legacy?.members.length) params.set("with", legacy.members.map((m) => m.id).join(","));
    if (weekParam) params.set("w", weekParam);
    redirect(`/calendar${params.size ? `?${params}` : ""}`);
  }
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

  const [conns, groups, stars] = await Promise.all([connectionsOf(viewer.id), listGroups(viewer.id), starsOf(viewer.id)]);
  const friends = conns.accepted
    .map((u) => ({ id: u.id, name: u.name, image: u.image }))
    .sort((a, b) => Number(stars.users.has(b.id)) - Number(stars.users.has(a.id)) || a.name.localeCompare(b.name));
  const selected = members.filter((m) => !m.isSelf).map((m) => ({ id: m.id, name: m.name, image: m.image }));
  const comparing = selected.length > 0;
  const baseParams: Record<string, string> = selected.length ? { with: selected.map((m) => m.id).join(",") } : {};
  const sameAsGroup = (gm: string[]) => gm.length === selected.length && gm.every((id) => selected.some((m) => m.id === id));
  // A group "is open" exactly when the view contains its people, however you got here.
  const match = selected.length ? groups.find((g) => sameAsGroup(g.members.map((m) => m.id))) : undefined;
  const matchedGroup = match
    ? {
        id: match.id,
        name: match.name,
        isOwner: match.isOwner,
        shareUrl: match.inviteCode ? `${appUrl()}/g/${match.inviteCode}` : null,
        ownerFirstName: match.isOwner ? undefined : match.members.find((m) => m.id === match.ownerId)?.name.split(" ")[0],
      }
    : null;
  const panelGroups = groups
    .map((g) => ({ id: g.id, name: g.name, memberIds: g.members.map((m) => m.id), starred: stars.groups.has(g.id) }))
    .sort((a, b) => Number(b.starred) - Number(a.starred) || a.name.localeCompare(b.name));
  const weekHref = (w: number) => `/calendar?${new URLSearchParams({ ...baseParams, w: isoDate(w) })}`;
  const todayIdx = todayIndexInWeek(weekStart, now);

  // Solo view: your own week with full details.
  const myCal = comparing ? null : await getCalendar(viewer.id);
  if (myCal && (!myCal.lastFetchedAt || now - myCal.lastFetchedAt > STALE_MS)) after(() => refreshCalendar(viewer.id));
  const [myWeek, myToday] = myCal
    ? await Promise.all([eventsBetween(viewer.id, weekStart, weekEnd), eventsBetween(viewer.id, dayStartOf(now), dayStartOf(now) + 86_400_000)])
    : [[], []];

  const groupChips = (
    <>
      {groups.filter((g) => matchedGroup?.id === g.id).map((g) => {
        const active = matchedGroup?.id === g.id;
        const ids = g.members.map((m) => m.id);
        const params = new URLSearchParams({ ...(active || ids.length === 0 ? {} : { with: ids.join(",") }), ...(weekParam ? { w: weekParam } : {}) });
        return (
          <Link
            key={g.id}
            href={`/calendar${params.size ? `?${params}` : ""}`}
            aria-pressed={active}
            title={active ? "Clear the view" : `Show ${g.name}`}
            className={button(active ? "dark" : "secondary")}
          >
            <span className={active ? "opacity-80 font-normal" : "text-muted font-normal"}>★</span>
            {g.name}
          </Link>
        );
      })}
      {selected.length > 0 && !matchedGroup && (
        <SaveGroupForm memberIds={selected.map((m) => m.id)} suggestion={selected.map((m) => m.name.split(" ")[0]).join(", ")} />
      )}
    </>
  );

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

      <div className="shrink-0">
        <GroupPicker friends={friends} selected={selected} week={weekParam ?? null} matchedGroup={matchedGroup} groups={panelGroups} starredUserIds={[...stars.users]} trailing={groupChips} />
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
          <Link href="/setup" className={button("primary", "md")}>Add my schedule</Link>
        </div>
      )}
    </main>
  );
}
