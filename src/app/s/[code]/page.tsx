import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { getUser } from "@/lib/auth";
import { STALE_MS, eventsBetween, getCalendar, refreshCalendar, statusFrom } from "@/lib/calendar";
import { mergeBlocks } from "@/lib/blocks";
import { inviteCodeFor, userByShareCode } from "@/lib/invites";
import { busyViews, statusView } from "@/lib/present";
import { addDays, dayStartOf, isoDate, nowMs, todayIndexInWeek, weekStartFromParam, weekStartOf } from "@/lib/time";
import { button, card } from "@/lib/ui";
import { Avatar } from "@/components/Avatar";
import { SignIn } from "@/components/SignIn";
import { StatusPill } from "@/components/StatusPill";
import { WeekNav } from "@/components/WeekNav";
import { WeekView } from "@/components/WeekView";

const firstName = (n: string) => n.split(" ")[0];

export async function generateMetadata({ params }: PageProps<"/s/[code]">): Promise<Metadata> {
  const { code } = await params;
  const owner = await userByShareCode(code);
  if (!owner) return { title: "Schedule", robots: { index: false, follow: false } };
  const title = `${firstName(owner.name)}’s week`;
  const description = `When ${firstName(owner.name)} is free and busy this week. See when you’re both free on dispo.`;
  return { title, description, robots: { index: false, follow: false }, openGraph: { title, description }, twitter: { card: "summary_large_image", title, description } };
}

/**
 * Public, view-only week (opt-in, free/busy only, no sign-up needed). Viewers get a gentle,
 * optional nudge: signing up through it connects them with the owner.
 */
export default async function PublicSchedule({ params, searchParams }: PageProps<"/s/[code]">) {
  const { code } = await params;
  const sp = await searchParams;
  const owner = await userByShareCode(code);
  if (!owner) notFound();
  const signedIn = await getUser();
  // The owner previews exactly what visitors see.
  const viewer = signedIn?.id === owner.id ? null : signedIn;
  const first = firstName(owner.name);
  const now = nowMs();
  const weekStart = weekStartFromParam(typeof sp.w === "string" ? sp.w : undefined);
  const cal = await getCalendar(owner.id);
  if (cal && (!cal.lastFetchedAt || now - cal.lastFetchedAt > STALE_MS)) after(() => refreshCalendar(owner.id));
  const [week, today] = cal
    ? await Promise.all([eventsBetween(owner.id, weekStart, addDays(weekStart, 7)), eventsBetween(owner.id, dayStartOf(now), dayStartOf(now) + 86_400_000)])
    : [[], []];
  const joinNext = `/i/${await inviteCodeFor(owner)}/accept`; // signing up connects them with the owner

  const nudge = viewer ? (
    <Link href={`/calendar?with=${owner.id}`} className={button("secondary")}>
      Compare with mine
    </Link>
  ) : (
    <a href={`/api/auth/google?next=${encodeURIComponent(joinNext)}`} className={button("secondary")}>
      See when we’re both free
    </a>
  );

  return (
    <main className={`mx-auto max-w-5xl flex flex-col ${viewer ? "h-[calc(100dvh-var(--nav-h))]" : "min-h-dvh"} py-4 md:py-8 gap-3`}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 shrink-0">
        <Avatar name={owner.name} image={owner.image} size={44} />
        <div className="flex-1 min-w-[9rem]">
          <h1 className="text-xl font-bold tracking-tight truncate">{first}’s week</h1>
          {cal && <StatusPill status={statusView(statusFrom(today, now), "busy")} />}
        </div>
        <div className="ml-auto">{nudge}</div>
      </header>

      {cal ? (
        <>
          <div className="flex justify-end shrink-0">
            <WeekNav weekStart={weekStart} thisWeekStart={weekStartOf(now)} hrefFor={(w) => `/s/${code}?w=${isoDate(w)}`} />
          </div>
          <div className={`flex flex-col ${viewer ? "flex-1 min-h-0" : "h-[70dvh] min-h-80"}`}>
            <WeekView weekStart={weekStart} events={busyViews(mergeBlocks(week))} todayIndex={todayIndexInWeek(weekStart, now)} now={now} masked={false} />
          </div>
        </>
      ) : (
        <p className={`${card} px-4 py-8 text-center text-muted`}>{first} hasn’t added a schedule yet.</p>
      )}

      {!viewer && (
        <section className={`${card} p-4 space-y-3 shrink-0`}>
          <div>
            <h2 className="font-bold">Find a time with {first}</h2>
            <p className="text-sm text-muted">Sign in with your EPFL account and add your timetable once. You’ll be connected with {first} and see both weeks side by side.</p>
          </div>
          <SignIn next={joinNext} />
        </section>
      )}
    </main>
  );
}
