import type { Metadata } from "next";
import Link from "next/link";
import { appUrl, requireUser } from "@/lib/auth";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import { eventsBetween, getCalendar, statusFrom } from "@/lib/calendar";
import { statusView } from "@/lib/present";
import { StatusPill } from "@/components/StatusPill";
import { addDays, dayStartOf, fmtDayLong, fmtDayMonth, fmtDayShort, fmtTime, localParts, relativeAge, nowMs, weekParam, weekStartOf } from "@/lib/time";
import { listTimeBlocks } from "@/lib/timeblocks";
import { Avatar } from "@/components/Avatar";
import { DiscoverToggle } from "@/components/DiscoverToggle";
import { PhoneForm } from "@/components/PhoneForm";
import { button, card, sectionTitle } from "@/lib/ui";
import { CalendarLinkForm } from "@/components/CalendarLinkForm";
import { inviteCodeFor } from "@/lib/invites";
import { icsErrorText } from "@/lib/ics";
import { LanguagePicker } from "@/components/LanguagePicker";
import { getLocale, getT } from "@/i18n/server";
import { refreshMyCalendar, removeMyCalendar, removeTimeBlockAction, setPublicLink, setVisibility, signOut } from "@/app/actions";
import type { Visibility } from "@/db/schema";
import { LOCALE_TAGS } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).nav.me };
}

const VISIBILITIES: Visibility[] = ["everyone", "connections", "private"];

export default async function MePage() {
  const user = await requireUser();
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const cal = await getCalendar(user.id);
  const today = cal ? await eventsBetween(user.id, dayStartOf(nowMs()), dayStartOf(nowMs()) + 86_400_000) : [];
  const now = nowMs();
  // The public link names its week, so each week's link gets a fresh preview in chat apps
  // (they cache previews per URL). From Saturday on, "my week" means the coming one.
  const weekend = localParts(now).day >= 5;
  const shareWeek = weekend ? addDays(weekStartOf(now), 7) : weekStartOf(now);
  const inviteUrl = `${appUrl()}/i/${await inviteCodeFor(user)}`;
  const timeBlocks = cal ? await listTimeBlocks(user.id, now) : [];
  const tb = t.calendar.blocks;

  return (
    <main className="mx-auto max-w-2xl py-6 md:py-10 space-y-6">
      <header className="flex items-center gap-3">
        <Avatar name={user.name} size={52} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight truncate">{user.name}</h1>
          <p className="text-sm text-muted truncate">{user.email}</p>
        </div>
      </header>

      {cal && (
        <Link href="/calendar" className={`${card} group flex items-center gap-3 px-4 py-3 hover:border-foreground`}>
          <span className="flex-1 min-w-0">
            <span className={`${sectionTitle} block mb-0.5`}>{t.me.rightNow}</span>
            <StatusPill status={statusView(statusFrom(today, now), t, "full")} />
          </span>
          <span className="text-sm link whitespace-nowrap">{t.me.myWeek}</span>
        </Link>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">{t.me.visibility.title}</h2>
        <form action={setVisibility} className="rounded-2xl bg-surface border border-line divide-y divide-line">
          {VISIBILITIES.map((v) => (
            <label key={v} className="flex items-start gap-3 px-4 py-3 cursor-pointer">
              <input type="radio" name="visibility" value={v} defaultChecked={user.visibility === v} className="mt-1 accent-[var(--accent)]" />
              <span className="flex-1">
                <span className="block font-medium">{t.me.visibility[v].title}</span>
                <span className="block text-sm text-muted">{t.me.visibility[v].desc}</span>
              </span>
            </label>
          ))}
          <div className="px-4 py-3">
            <button type="submit" className={button("dark", "md", "w-full")}>
              {t.common.save}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">{t.lang.title}</h2>
        <div className={`${card} p-4 space-y-3`}>
          <p className="text-sm text-muted">{t.lang.hint}</p>
          <LanguagePicker current={locale} />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>{t.me.inviteTitle}</h2>
        <div className={`${card} flex flex-wrap items-center gap-3 p-4`}>
          <p className="flex-1 min-w-[12rem] text-sm text-muted">{t.common.invite.blurb}</p>
          <ShareLinkButton url={inviteUrl} text={t.common.invite.text} label={t.common.invite.share} variant="primary" />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>{t.me.publicLink.title}</h2>
        <div className={`${card} p-4 space-y-3`}>
          <p className="text-sm text-muted">{t.me.publicLink.blurb}</p>
          {user.shareCode ? (
            <div className="flex flex-wrap items-center gap-2">
              <ShareLinkButton url={`${appUrl()}/s/${user.shareCode}?w=${weekParam(shareWeek)}`} text={weekend ? t.me.publicLink.textNextWeek : t.me.publicLink.textThisWeek} label={t.me.publicLink.share} variant="primary" />
              <a href={`/s/${user.shareCode}`} target="_blank" rel="noopener" className={button("secondary")}>
                {t.me.publicLink.preview}
              </a>
              <form action={setPublicLink}>
                <input type="hidden" name="on" value="1" />
                <button className={button("quiet")} title={t.me.publicLink.resetHint}>
                  {t.me.publicLink.reset}
                </button>
              </form>
              <form action={setPublicLink}>
                <input type="hidden" name="on" value="0" />
                <button className={button("danger")}>{t.me.publicLink.turnOff}</button>
              </form>
            </div>
          ) : (
            <form action={setPublicLink}>
              <input type="hidden" name="on" value="1" />
              <button className={button("secondary")}>{t.me.publicLink.create}</button>
            </form>
          )}
        </div>
      </section>

      <section id="discover" className="space-y-2 scroll-mt-6">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">{t.me.discover.title}</h2>
        <div className="rounded-2xl bg-surface border border-line">
          <DiscoverToggle on={user.discoverable} />
          <PhoneForm phone={user.phone} />
        </div>
      </section>

      {cal && (
        <section className="space-y-2">
          <h2 className={sectionTitle}>{tb.manageTitle}</h2>
          <div className={`${card} divide-y divide-line`}>
            <p className="px-4 py-3 text-sm text-muted">{tb.manageHint}</p>
            {timeBlocks.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted">{tb.manageEmpty}</p>
            ) : (
              timeBlocks.map((b) => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-2">
                  <span className={`shrink-0 text-xs font-bold uppercase tracking-wide w-24 whitespace-nowrap ${b.kind === "free" ? "text-free" : ""}`}>{tb[b.kind]}</span>
                  <span className="flex-1 min-w-0 text-sm">
                    <span className="block">
                      {b.weekly ? tb.everyDay(fmtDayLong(b.start, locale)) : `${fmtDayShort(b.start, locale)} ${fmtDayMonth(b.start, locale)}`} · {fmtTime(b.start)}–{fmtTime(b.end)}
                    </span>
                    {(b.note || b.until) && (
                      <span className="block text-muted truncate">
                        {[b.note, b.until ? tb.untilDate(fmtDayMonth(b.until - 1, locale)) : null].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </span>
                  <form action={removeTimeBlockAction.bind(null, b.id)}>
                    <button className={button("quiet")}>{tb.remove}</button>
                  </form>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">{t.me.calendar.title}</h2>
        {cal ? (
          <div className="rounded-2xl bg-surface border border-line divide-y divide-line">
            <div className="px-4 py-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted">{t.me.calendar.sessions}</span><span className="font-medium tabular-nums">{cal.eventCount.toLocaleString(LOCALE_TAGS[locale])}</span></div>
              <div className="flex justify-between"><span className="text-muted">{t.me.calendar.lastSynced}</span><span className="font-medium">{relativeAge(cal.lastOkAt, t.common.ago, now)}</span></div>
              {cal.lastError && <p className="text-busy text-xs pt-1">{t.me.calendar.lastError(icsErrorText(cal.lastError, t.setup.errors))}</p>}
            </div>
            <div className="px-4 py-3 flex gap-2">
              <form action={refreshMyCalendar} className="flex-1">
                <button className={button("secondary", "md", "w-full")}>{t.me.calendar.refresh}</button>
              </form>
              <Link href={`/u/${user.id}`} className={button("secondary", "md", "flex-1")}>
                {t.me.calendar.viewWeek}
              </Link>
            </div>
            <details className="px-4 py-3">
              <summary className="text-sm font-medium cursor-pointer">{t.me.calendar.replace}</summary>
              <div className="pt-3">
                <CalendarLinkForm stay compact />
              </div>
            </details>
            <form action={removeMyCalendar} className="px-4 py-3">
              <button className={button("danger", "sm", "-ml-3")}>{t.me.calendar.remove}</button>
            </form>
          </div>
        ) : (
          <div className="rounded-2xl bg-surface border border-line p-4 space-y-3">
            <p className="text-sm text-muted">{t.me.calendar.none}</p>
            <CalendarLinkForm />
          </div>
        )}
      </section>

      <form action={signOut}>
        <button className={button("secondary", "md", "w-full text-muted")}>{t.me.signOut}</button>
      </form>

      <p className="text-center text-xs text-muted">
        {t.me.openSource}{" "}
        <a href="https://github.com/a2br/dispo" target="_blank" rel="noopener" className="link">
          {t.me.viewCode}
        </a>
      </p>
    </main>
  );
}
