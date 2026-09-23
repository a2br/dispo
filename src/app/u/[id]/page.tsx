import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { requireUser } from "@/lib/auth";
import { accessFor, hasSchedule, relationTo } from "@/lib/access";
import { STALE_MS, eventsBetween, getCalendar, getUserById, refreshCalendar, statusFrom } from "@/lib/calendar";
import { busyViews, eventView, statusView } from "@/lib/present";
import { mergeBlocks } from "@/lib/blocks";
import { sharedCourses } from "@/lib/classmates";
import { features } from "@/lib/features";
import { CourseChips } from "@/components/CourseChips";
import { addDays, dayStartOf, relativeAge, todayIndexInWeek, weekParam, weekStartFromParam, weekStartOf, nowMs } from "@/lib/time";
import { Avatar } from "@/components/Avatar";
import { ConnectButton } from "@/components/ConnectButton";
import { StatusPill } from "@/components/StatusPill";
import { WeekView } from "@/components/WeekView";
import { WeekNav } from "@/components/WeekNav";
import { ReachLinks } from "@/components/ReachLinks";
import { StarButton } from "@/components/StarButton";
import { starsOf } from "@/lib/stars";
import { button } from "@/lib/ui";

export async function generateMetadata({ params }: PageProps<"/u/[id]">): Promise<Metadata> {
  const { id } = await params;
  const u = await getUserById(id);
  return { title: u ? u.name : "Person" };
}

export default async function PersonPage({ params, searchParams }: PageProps<"/u/[id]">) {
  const viewer = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  if (id === viewer.id) redirect(`/calendar${typeof sp.w === "string" ? `?w=${sp.w}` : ""}`);
  const target = await getUserById(id);
  if (!target) notFound();

  const rel = await relationTo(viewer.id, target);
  const mine = await hasSchedule(viewer.id);
  const access = accessFor(target, rel, mine);
  if (access === "none") {
    // Findable by name, schedule not shown: either they keep it private, or you haven't added yours yet.
    const needsSchedule = !mine;
    return (
      <main className="mx-auto max-w-2xl py-6 md:py-10 space-y-5">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Avatar name={target.name} size={44} />
          <div className="flex-1 min-w-[9rem]">
            <h1 className="text-xl font-bold tracking-tight truncate">{target.name}</h1>
            <p className="text-sm text-muted">{needsSchedule ? "Add your schedule to see" : "Schedule is private"}</p>
          </div>
          <ConnectButton userId={target.id} rel={rel} />
        </header>
        <div className="border border-line px-4 py-6 text-center space-y-3">
          <p className="text-sm text-muted">
            {needsSchedule
              ? "Schedules work both ways: add yours to see people you’re not connected with yet. Your connections can always see each other."
              : `Only people ${target.name.split(" ")[0]} has accepted can see their schedule. Send a request to connect.`}
          </p>
          {needsSchedule && (
            <Link href={`/setup?next=${encodeURIComponent(`/u/${target.id}`)}`} className={button("primary")}>
              Add my schedule
            </Link>
          )}
        </div>
      </main>
    );
  }

  const cal = await getCalendar(target.id);
  const now = nowMs();
  const weekStart = weekStartFromParam(typeof sp.w === "string" ? sp.w : undefined);
  const weekEnd = addDays(weekStart, 7);

  // Refresh a stale feed after the response is sent; the page shows what we have.
  if (cal && (!cal.lastFetchedAt || now - cal.lastFetchedAt > STALE_MS)) {
    after(() => refreshCalendar(target.id));
  }

  const [weekEvents, todayEvents] = cal
    ? await Promise.all([eventsBetween(target.id, weekStart, weekEnd), eventsBetween(target.id, dayStartOf(now), dayStartOf(now) + 86_400_000)])
    : [[], []];
  const status = cal ? statusFrom(todayEvents, now) : ({ state: "unknown" } as const);
  const isSelf = false; // your own page redirects to /calendar above
  const overlap = features.classmates && !isSelf && cal ? await sharedCourses(viewer.id, target.id) : null;

  const first = target.name.split(" ")[0];
  const starred = (await starsOf(viewer.id)).users.has(target.id);
  const sharesCourse = Boolean(overlap && overlap.shared.length > 0);
  const showPhone = Boolean(target.phone) && (rel.kind === "accepted" || (target.discoverable && viewer.discoverable && sharesCourse));

  // Same full-height layout as Calendar: the week fits the screen without page scrolling.
  return (
    <main className="mx-auto max-w-5xl flex flex-col h-[calc(100dvh-var(--nav-h))] py-4 md:py-8 gap-3">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 shrink-0">
        <Avatar name={target.name} size={44} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight truncate">{target.name}</h1>
          <StatusPill status={statusView(status, access)} />
          {showPhone && target.phone && <ReachLinks phone={target.phone} />}
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:ml-auto">
          {cal && (
            <Link href={`/calendar?with=${target.id}`} className={button("secondary")} title={`Find a time with ${first}`}>
              Compare
            </Link>
          )}
          <ConnectButton userId={target.id} rel={rel} />
          <StarButton kind="user" id={target.id} starred={starred} name={target.name} />
        </div>
      </header>

      {overlap && overlap.mine.length > 0 && (
        <div className="shrink-0 border border-line px-3 py-2 text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-bold">
            {overlap.shared.length === 0
              ? "No courses in common with you."
              : `Shares ${overlap.shared.length} of your ${overlap.mine.length} course${overlap.mine.length === 1 ? "" : "s"}`}
          </span>
          {overlap.shared.length > 0 && <CourseChips courses={overlap.shared} />}
        </div>
      )}

      {!cal ? (
        <div className="border border-line px-4 py-10 text-center">
          <p className="text-muted">{first} hasn’t added a schedule yet.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-end shrink-0">
            <WeekNav weekStart={weekStart} thisWeekStart={weekStartOf(now)} hrefFor={(w) => `/u/${target.id}?w=${weekParam(w)}`} />
          </div>
          <WeekView
            weekStart={weekStart}
            events={access === "full" ? weekEvents.map(eventView) : busyViews(mergeBlocks(weekEvents))}
            todayIndex={todayIndexInWeek(weekStart, now)}
            now={now}
            masked={access === "busy"}
          />
          <p className="shrink-0 text-[11px] text-muted text-center">
            Synced {relativeAge(cal.lastOkAt, now)}
            {cal.lastError ? " · last refresh failed" : ""}
          </p>
        </>
      )}
    </main>
  );
}
