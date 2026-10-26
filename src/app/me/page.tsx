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
import { ButtonRow, SettingsChoice, SettingsDisclosure, SettingsRow, SettingsSection } from "@/components/Settings";
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

      <SettingsSection title={t.me.visibility.title}>
        <form action={setVisibility} className="divide-y divide-line">
          {VISIBILITIES.map((v) => (
            <SettingsChoice key={v} name="visibility" value={v} defaultChecked={user.visibility === v} title={t.me.visibility[v].title} hint={t.me.visibility[v].desc} />
          ))}
          <SettingsRow>
            <button type="submit" className={button("secondary")}>
              {t.common.save}
            </button>
          </SettingsRow>
        </form>
      </SettingsSection>

      <SettingsSection title={t.lang.title}>
        <SettingsRow hint={t.lang.hint} action={<LanguagePicker current={locale} />} />
      </SettingsSection>

      <SettingsSection title={t.me.inviteTitle}>
        <SettingsRow hint={t.common.invite.blurb} action={<ShareLinkButton url={inviteUrl} text={t.common.invite.text} label={t.common.invite.share} variant="primary" />} />
      </SettingsSection>

      <SettingsSection title={t.me.publicLink.title}>
        {user.shareCode ? (
          <SettingsRow hint={t.me.publicLink.blurb}>
            <ButtonRow>
              <ShareLinkButton url={`${appUrl()}/s/${user.shareCode}?w=${weekParam(shareWeek)}`} text={weekend ? t.me.publicLink.textNextWeek : t.me.publicLink.textThisWeek} label={t.me.publicLink.share} variant="primary" />
              <a href={`/s/${user.shareCode}`} target="_blank" rel="noopener" className={button("secondary")}>
                {t.me.publicLink.preview}
              </a>
              <form action={setPublicLink}>
                <input type="hidden" name="on" value="1" />
                <button className={button("secondary")} title={t.me.publicLink.resetHint}>
                  {t.me.publicLink.reset}
                </button>
              </form>
              <form action={setPublicLink}>
                <input type="hidden" name="on" value="0" />
                <button className={button("danger")}>{t.me.publicLink.turnOff}</button>
              </form>
            </ButtonRow>
          </SettingsRow>
        ) : (
          <SettingsRow
            hint={t.me.publicLink.blurb}
            action={
              <form action={setPublicLink}>
                <input type="hidden" name="on" value="1" />
                <button className={button("secondary")}>{t.me.publicLink.create}</button>
              </form>
            }
          />
        )}
      </SettingsSection>

      <SettingsSection id="discover" title={t.me.discover.title}>
        <DiscoverToggle on={user.discoverable} />
        <PhoneForm phone={user.phone} />
      </SettingsSection>

      {cal && (
        <SettingsSection title={tb.manageTitle}>
          <SettingsRow hint={tb.manageHint} />
          {timeBlocks.length === 0 ? (
            <SettingsRow hint={tb.manageEmpty} />
          ) : (
            timeBlocks.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-2">
                <span className={`shrink-0 text-xs font-bold uppercase tracking-wide w-24 whitespace-nowrap ${b.kind !== "busy" ? "text-free" : ""}`}>{tb[b.kind]}</span>
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
        </SettingsSection>
      )}

      <SettingsSection title={t.me.calendar.title}>
        {cal ? (
          <>
            <SettingsRow>
              <div className="text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted">{t.me.calendar.sessions}</span><span className="font-medium tabular-nums">{cal.eventCount.toLocaleString(LOCALE_TAGS[locale])}</span></div>
                <div className="flex justify-between"><span className="text-muted">{t.me.calendar.lastSynced}</span><span className="font-medium">{relativeAge(cal.lastOkAt, t.common.ago, now)}</span></div>
                {cal.lastError && <p className="text-busy text-xs pt-1">{t.me.calendar.lastError(icsErrorText(cal.lastError, t.setup.errors))}</p>}
              </div>
              <ButtonRow>
                <form action={refreshMyCalendar}>
                  <button className={button("secondary")}>{t.me.calendar.refresh}</button>
                </form>
                <Link href={`/u/${user.id}`} className={button("secondary")}>
                  {t.me.calendar.viewWeek}
                </Link>
              </ButtonRow>
            </SettingsRow>
            <SettingsDisclosure title={t.me.calendar.replace}>
              <CalendarLinkForm stay compact />
            </SettingsDisclosure>
            <SettingsRow>
              <form action={removeMyCalendar}>
                <button className={button("danger")}>{t.me.calendar.remove}</button>
              </form>
            </SettingsRow>
          </>
        ) : (
          <SettingsRow hint={t.me.calendar.none}>
            <CalendarLinkForm />
          </SettingsRow>
        )}
      </SettingsSection>

      <form action={signOut}>
        <button className={button("secondary", "md", "w-full")}>{t.me.signOut}</button>
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
