import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { requireUser } from "@/lib/auth";
import { accessFor, relationTo } from "@/lib/access";
import { STALE_MS, eventsBetween, getCalendar, getUserById, refreshCalendar, statusFrom } from "@/lib/calendar";
import { busyViews, eventView, statusView } from "@/lib/present";
import { mergeBlocks } from "@/lib/blocks";
import { sharedCourses } from "@/lib/classmates";
import { features } from "@/lib/features";
import { CourseChips } from "@/components/CourseChips";
import { addDays, dayStartOf, relativeAge, todayIndexInWeek, weekStartFromParam, nowMs } from "@/lib/time";
import { Avatar } from "@/components/Avatar";
import { ConnectButton } from "@/components/ConnectButton";
import { StatusPill } from "@/components/StatusPill";
import { WeekView } from "@/components/WeekView";

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
  const access = accessFor(target, rel);
  if (access === "none") notFound();

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
  const isSelf = rel.kind === "self";
  const overlap = features.classmates && !isSelf && cal ? await sharedCourses(viewer.id, target.id) : null;

  return (
    <main className="mx-auto max-w-5xl py-6 md:py-10 space-y-5">
      <header className="flex flex-wrap items-start gap-3">
        <Avatar name={target.name} image={target.image} size={52} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight truncate">{isSelf ? "My week" : target.name}</h1>
          <StatusPill status={statusView(status, access)} big />
          {isSelf && <p className="text-xs text-muted mt-0.5 truncate">{target.email}</p>}
        </div>
        <div className="ml-auto">
          <ConnectButton userId={target.id} rel={rel} />
        </div>
      </header>

      {overlap && overlap.mine.length > 0 && (
        <div className="rounded-2xl bg-surface border border-line px-4 py-3 text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium">
            {overlap.shared.length === 0
              ? "No courses in common with you."
              : `Shares ${overlap.shared.length} of your ${overlap.mine.length} course${overlap.mine.length === 1 ? "" : "s"}`}
          </span>
          {overlap.shared.length > 0 && <CourseChips courses={overlap.shared} />}
        </div>
      )}

      {!isSelf && cal && (
        <Link href={`/calendar?with=${target.id}`} className="flex items-center justify-between rounded-2xl bg-surface border border-line px-4 py-3 text-sm active:opacity-70">
          <span className="font-medium">Find a time with {target.name.split(" ")[0]}</span>
          <span className="text-accent">Open in calendar ›</span>
        </Link>
      )}

      {!cal ? (
        <div className="rounded-2xl bg-surface border border-line px-4 py-10 text-center space-y-3">
          <p className="text-muted">{isSelf ? "You haven’t added your schedule yet." : `${target.name.split(" ")[0]} hasn’t added a schedule yet.`}</p>
          {isSelf && (
            <Link href="/setup" className="inline-block rounded-full bg-accent text-white px-5 py-2.5 font-semibold">
              Add my schedule
            </Link>
          )}
        </div>
      ) : (
        <WeekView
          weekStart={weekStart}
          events={access === "full" ? weekEvents.map(eventView) : busyViews(mergeBlocks(weekEvents))}
          todayIndex={todayIndexInWeek(weekStart, now)}
          now={now}
          basePath={`/u/${target.id}`}
          masked={access === "busy"}
        />
      )}

      {cal && (
        <p className="text-[11px] text-muted text-center">
          Synced {relativeAge(cal.lastOkAt, now)}
          {cal.lastError ? " · last refresh failed" : ""}
          {isSelf ? " · manage in Settings" : ""}
        </p>
      )}
    </main>
  );
}
