import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { isLocale } from "@/i18n/config";
import { messages } from "@/i18n/messages";
import { getLocale, getT } from "@/i18n/server";
import { getUser } from "@/lib/auth";
import { STALE_MS, eventsBetween, getCalendar, refreshCalendar, statusFrom } from "@/lib/calendar";
import { mergeBlocks } from "@/lib/blocks";
import { inviteCodeFor, userByShareCode } from "@/lib/invites";
import { busyViews, statusView } from "@/lib/present";
import { addDays, dayStartOf, fmtWeekLabel, nowMs, todayIndexInWeek, weekParam, weekStartFromParam, weekStartOf } from "@/lib/time";
import { button, card } from "@/lib/ui";
import { Avatar } from "@/components/Avatar";
import { SignIn } from "@/components/SignIn";
import { StatusPill } from "@/components/StatusPill";
import { WeekNav } from "@/components/WeekNav";
import { WeekView } from "@/components/WeekView";

const firstName = (n: string) => n.split(" ")[0];

export async function generateMetadata({ params, searchParams }: PageProps<"/s/[code]">): Promise<Metadata> {
  const { code } = await params;
  const sp = await searchParams;
  const owner = await userByShareCode(code);
  const t = await getT();
  const locale = await getLocale();
  if (!owner) return { title: t.share.schedule.title, robots: { index: false, follow: false } };
  const first = firstName(owner.name);
  // The preview draws the week this link opens on, so `?w=` is carried into the image URL too.
  const weekStart = weekStartFromParam(typeof sp.w === "string" ? sp.w : undefined);
  const title = t.share.weekOf(first);
  const description = t.share.schedule.description(first, fmtWeekLabel(weekStart, locale));
  // The link preview speaks the owner's language (crawlers send no cookie, and the owner is the one sharing it).
  const ownerLocale = isLocale(owner.locale) ? owner.locale : "en";
  const o = messages[ownerLocale].share;
  const og = { title: o.weekOf(first), description: o.schedule.description(first, fmtWeekLabel(weekStart, ownerLocale)) };
  const images = [{ url: `/s/${code}/og?w=${weekParam(weekStart)}`, width: 1200, height: 630, alt: o.schedule.imageAlt(first) }];
  return { title, description, robots: { index: false, follow: false }, openGraph: { ...og, images }, twitter: { card: "summary_large_image", ...og, images } };
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
  const t = await getT();
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
      {t.share.schedule.compareMine}
    </Link>
  ) : (
    <a href={`/api/auth/google?next=${encodeURIComponent(joinNext)}`} className={button("secondary")}>
      {t.share.schedule.bothFree}
    </a>
  );

  return (
    <main className={`mx-auto max-w-5xl flex flex-col ${viewer ? "h-[calc(100dvh-var(--nav-h))]" : "min-h-dvh"} py-4 md:py-8 gap-3`}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 shrink-0">
        <Avatar name={owner.name} size={44} />
        <div className="flex-1 min-w-[9rem]">
          <h1 className="text-xl font-bold tracking-tight truncate">{t.share.weekOf(first)}</h1>
          {cal && <StatusPill status={statusView(statusFrom(today, now), t, "busy")} />}
        </div>
        <div className="ml-auto">{nudge}</div>
      </header>

      {cal ? (
        <>
          <div className="flex justify-end shrink-0">
            <WeekNav weekStart={weekStart} thisWeekStart={weekStartOf(now)} hrefFor={(w) => `/s/${code}?w=${weekParam(w)}`} />
          </div>
          <div className={`flex flex-col ${viewer ? "flex-1 min-h-0" : "h-[70dvh] min-h-80"}`}>
            <WeekView weekStart={weekStart} events={busyViews(mergeBlocks(week), t)} todayIndex={todayIndexInWeek(weekStart, now)} now={now} masked={false} />
          </div>
        </>
      ) : (
        <p className={`${card} px-4 py-8 text-center text-muted`}>{t.share.noSchedule(first)}</p>
      )}

      {!viewer && (
        <section className={`${card} p-4 space-y-3 shrink-0`}>
          <div>
            <h2 className="font-bold">{t.share.findTime(first)}</h2>
            <p className="text-sm text-muted">{t.share.schedule.signInBlurb(first)}</p>
          </div>
          <SignIn next={joinNext} />
        </section>
      )}
    </main>
  );
}
