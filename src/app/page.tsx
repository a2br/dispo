import Link from "next/link";
import { button, card, iconButton, sectionTitle } from "@/lib/ui";
import { Wordmark } from "@/components/Wordmark";
import { dayStartOf, nowMs } from "@/lib/time";
import { appUrl, getUser } from "@/lib/auth";
import { Fineprint, SignIn } from "@/components/SignIn";
import { connectionsOf, getCalendar, statusesFor, todayBlocksFor, usersWithCalendar, type Status } from "@/lib/calendar";
import { invitesFor, listGroups } from "@/lib/groups";
import { visibleStatuses } from "@/lib/access";
import { GroupInviteModal } from "@/components/GroupInviteModal";
import { inviteCodeFor } from "@/lib/invites";
import { nextCommonSlots } from "@/lib/nextSlot";
import { starsOf } from "@/lib/stars";
import { GroupCards } from "@/components/GroupCards";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import { CourseChips } from "@/components/CourseChips";
import { TodayScale, TodayStrip } from "@/components/TodayStrip";
import { publicPerson } from "@/lib/present";
import { classmatesFor } from "@/lib/classmates";
import { features } from "@/lib/features";
import { PersonRow } from "@/components/PersonRow";
import { SearchBox } from "@/components/SearchBox";
import { acceptConnection, dismissInviteCard, removeConnection } from "./actions";
import { CloseIcon } from "@/components/Icons";
import { LiveClock } from "@/components/LiveClock";
import { count } from "drizzle-orm";
import { db, dbReady, schema } from "@/db";
import { getLocale, getT } from "@/i18n/server";
import { LOCALE_TAGS } from "@/i18n/config";
import { LanguagePicker } from "@/components/LanguagePicker";

export default async function Home({ searchParams }: PageProps<"/">) {
  const user = await getUser();
  const sp = await searchParams;
  if (!user) return <Landing error={typeof sp.error === "string" ? sp.error : undefined} />;

  const t = await getT();
  const now = nowMs();
  const [cal, conns, groups, { mine, classmates }, inviteCode, stars, invites] = await Promise.all([
    getCalendar(user.id),
    connectionsOf(user.id),
    listGroups(user.id),
    features.classmates ? classmatesFor(user) : Promise.resolve({ mine: [], classmates: [] }),
    inviteCodeFor(user),
    starsOf(user.id),
    invitesFor(user.id),
  ]);
  const inviteUrl = `${appUrl()}/i/${inviteCode}`;
  const ids = [
    ...new Set(
      [user.id, ...conns.accepted, ...conns.incoming, ...conns.outgoing, ...classmates.slice(0, 30).map((c) => c.user)].map((u) => (typeof u === "string" ? u : u.id)),
    ),
  ];
  const [statuses, blocks, calIds, groupNext] = await Promise.all([
    statusesFor(ids),
    todayBlocksFor(conns.accepted.map((u) => u.id), now),
    usersWithCalendar(conns.accepted.map((u) => u.id)),
    cal ? nextCommonSlots(groups.map((g) => ({ id: g.id, userIds: [user.id, ...g.members.map((m) => m.id)] })), now) : Promise.resolve(new Map()),
  ]);
  const view = (u: (typeof conns.accepted)[number]) => publicPerson(u, statuses.get(u.id) ?? { state: "unknown" }, t);
  const dayStart = dayStartOf(now);

  // One list, ordered by the question people open the app for: who can I see now, and when?
  // Pinned first, then free (longest free first), then busy (soonest free first, dimmed), then no schedule.
  const order = (st: Status) => (st.state === "free" ? 0 : st.state === "busy" ? 1 : 2);
  const people = conns.accepted
    .map((u) => ({ u, s: statuses.get(u.id) ?? ({ state: "unknown" } as const), pinned: stars.users.has(u.id) }))
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        order(a.s) - order(b.s) ||
        (a.s.state === "free" ? untilOf(b.s) - untilOf(a.s) : untilOf(a.s) - untilOf(b.s)) ||
        a.u.name.localeCompare(b.u.name),
    );
  const freeCount = people.filter((x) => x.s.state === "free").length;
  const sortedGroups = [...groups].sort((a, b) => Number(stars.groups.has(b.id)) - Number(stars.groups.has(a.id)) || a.name.localeCompare(b.name));
  const onboarding = !cal || conns.accepted.length === 0;

  // Classmates preview: strongest course overlap first, people you're not connected to yet.
  const CLASSMATES_CAP = 5;
  const minShared = mine.length <= 2 ? 1 : 2;
  const connectedIds = new Set([...conns.accepted, ...conns.outgoing, ...conns.incoming].map((u) => u.id));
  const suggested = classmates.filter((c) => !connectedIds.has(c.user.id) && c.shared.length >= minShared);
  const shownClassmates = suggested.slice(0, CLASSMATES_CAP);
  const classmateStatuses = await visibleStatuses(user, shownClassmates.map((c) => c.user));

  const strip = (id: string) => (
    <div className="hidden md:block w-56 lg:w-72 shrink-0">
      <TodayStrip blocks={blocks.get(id) ?? []} dayStart={dayStart} now={now} known={calIds.has(id)} />
    </div>
  );
  const peopleList = (list: typeof people) => (
    <ul className={`${card} divide-y divide-line`}>
      {list.map(({ u, s, pinned }) => (
        <PersonRow key={u.id} person={view(u)} trailing={strip(u.id)} pinned={pinned} dim={s.state !== "free"} />
      ))}
    </ul>
  );

  return (
    <>
      {/* Outside <main>: its fade-in animation makes it a stacking context that would keep the dialog under the nav. */}
      {invites.length > 0 && <GroupInviteModal invite={invites[0]} more={invites.length - 1} />}
      <main className="py-6 md:py-10 space-y-6">
        <header className="flex items-baseline justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t.now.title}</h1>
          <LiveClock now={now} className="text-xs md:text-sm text-muted whitespace-nowrap" />
        </header>

        {!onboarding && !user.hideInviteCard && (
          <section className={`${card} relative flex flex-wrap items-center gap-x-4 gap-y-3 p-4 pr-12`}>
            <div className="flex-1 min-w-[12rem]">
              <h2 className="font-bold">{t.now.inviteCard.title}</h2>
              <p className="text-sm text-muted">{t.common.invite.blurb}</p>
            </div>
            <ShareLinkButton url={inviteUrl} text={t.common.invite.text} label={t.common.invite.share} variant="primary" />
            <form action={dismissInviteCard} className="absolute top-2 right-2">
              <button className={iconButton("quiet")} aria-label={t.now.inviteCard.hide} title={t.now.inviteCard.hideShort}>
                <CloseIcon />
              </button>
            </form>
          </section>
        )}

        {/* Front and center: anyone at EPFL, on dispo or not (not-yet-members can be invited). */}
        <section className="space-y-1.5">
          <SearchBox inviteUrl={inviteUrl} placeholder={t.now.searchPlaceholder} />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
          {/* Main column: you, then your people split into free now / busy */}
          <div className="space-y-6 min-w-0">
            {onboarding && (
              <section className={`${card} p-4 space-y-4`}>
                <div>
                  <h2 className="font-bold text-lg">{t.now.onboarding.title}</h2>
                  <p className="text-sm text-muted">{t.now.onboarding.intro}</p>
                </div>
                <ol className="space-y-3">
                  <Step n={1} done={Boolean(cal)} title={t.now.onboarding.scheduleTitle} detail={t.now.onboarding.scheduleDetail}>
                    {!cal && (
                      <Link href="/setup" className={button("primary")}>
                        {t.now.onboarding.scheduleButton}
                      </Link>
                    )}
                  </Step>
                  <Step n={2} done={conns.accepted.length > 0} title={t.now.onboarding.peopleTitle} detail={t.now.onboarding.peopleDetail}>
                    {conns.accepted.length === 0 && (
                      <ShareLinkButton url={inviteUrl} text={t.common.invite.text} label={t.common.invite.share} variant={cal ? "primary" : "secondary"} />
                    )}
                  </Step>
                </ol>
              </section>
            )}

            {conns.incoming.length > 0 && (
              <section>
                <h2 className={`${sectionTitle} mb-2`}>{t.now.wantsToConnect(conns.incoming.length)}</h2>
                <ul className={`${card} divide-y divide-line`}>
                  {conns.incoming.map((u) => (
                    <PersonRow
                      key={u.id}
                      person={view(u)}
                      trailing={
                        <div className="flex gap-2">
                          <form action={acceptConnection}>
                            <input type="hidden" name="userId" value={u.id} />
                            <button className={button("success")}>{t.now.accept}</button>
                          </form>
                          <form action={removeConnection}>
                            <input type="hidden" name="userId" value={u.id} />
                            <button className={iconButton("secondary")} aria-label={t.now.decline}>
                              ✕
                            </button>
                          </form>
                        </div>
                      }
                    />
                  ))}
                </ul>
              </section>
            )}

            {people.length > 0 && (
              <>
                <div className="hidden md:flex items-end justify-end -mb-4">
                  <div className="w-56 lg:w-72 mr-4">
                    <TodayScale />
                  </div>
                </div>
                <section>
                  <h2 className={`${sectionTitle} mb-2`}>
                    {t.now.yourPeople} <span className="font-normal normal-case tracking-normal">· {t.now.freeNow(freeCount)}</span>
                  </h2>
                  {peopleList(people)}
                </section>
              </>
            )}
          </div>

          {/* Side column: groups, invite, search, discover */}
          <div className="space-y-6 min-w-0 xl:sticky xl:top-10">
            <section>
              <div className="flex items-center justify-between gap-3 mb-2">
                <h2 className={sectionTitle}>{t.now.groups}</h2>
                <Link href="/groups/new" className={button("secondary")}>
                  {t.now.createGroup}
                </Link>
              </div>
              {groups.length > 0 ? (
                <GroupCards groups={sortedGroups} next={groupNext} now={now} pinned={stars.groups} locked={!cal} />
              ) : (
                <p className={`${card} px-4 py-4 text-sm text-muted`}>{t.now.groupsEmpty}</p>
              )}
            </section>

            {/* The big invite card can be dismissed; the link itself stays one tap away. */}
            {!onboarding && user.hideInviteCard && (
              <section className={`${card} flex items-center gap-3 px-4 py-3`}>
                <p className="flex-1 min-w-0 text-sm text-muted">{t.now.inviteCard.small}</p>
                <ShareLinkButton url={inviteUrl} text={t.common.invite.text} label={t.common.invite.short} variant="secondary" />
              </section>
            )}

            {features.classmates && user.discoverable && mine.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <h2 className={sectionTitle}>{t.now.classmates}</h2>
                  <Link href="/discover" className="text-sm link">
                    {t.now.discover}
                  </Link>
                </div>
                {shownClassmates.length === 0 ? (
                  <div className={`${card} px-4 py-6 text-center text-muted text-sm`}>{t.now.classmatesEmpty}</div>
                ) : (
                  <ul className={`${card} divide-y divide-line`}>
                    {shownClassmates.map((m) => (
                      <PersonRow
                        key={m.user.id}
                        person={publicPerson(m.user, classmateStatuses.get(m.user.id) ?? { state: "unknown" }, t)}
                        trailing={
                          <span className="text-sm font-bold tabular-nums whitespace-nowrap" title={t.now.sharedCourses(m.shared.length, mine.length)}>
                            {m.shared.length}/{mine.length}
                          </span>
                        }
                        footer={<CourseChips courses={m.shared} max={4} />}
                      />
                    ))}
                  </ul>
                )}
                {suggested.length > CLASSMATES_CAP && (
                  <Link href="/discover" className={button("secondary", "md", "mt-2 w-full")}>
                    {t.now.seeAllClassmates(suggested.length)}
                  </Link>
                )}
              </section>
            )}

            {conns.outgoing.length > 0 && (
              <section>
                <h2 className={`${sectionTitle} mb-2`}>{t.now.requested}</h2>
                <ul className={`${card} divide-y divide-line`}>
                  {conns.outgoing.map((u) => (
                    <PersonRow key={u.id} person={view(u)} trailing={<span className="text-xs text-muted">{t.now.pending}</span>} />
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function untilOf(s: Status): number {
  return s.state === "busy" ? s.until : s.state === "free" ? (s.until ?? Number.MAX_SAFE_INTEGER) : 0;
}

function Step({ n, done, title, detail, children }: { n: number; done: boolean; title: string; detail: string; children?: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className={`size-6 shrink-0 rounded-sm grid place-items-center text-xs font-bold ${done ? "bg-free text-white" : "bg-foreground text-background"}`}>{done ? "✓" : n}</span>
      <div className="flex-1 space-y-2">
        <div>
          <div className={`font-bold ${done ? "text-muted line-through decoration-1" : ""}`}>{title}</div>
          {!done && <div className="text-sm text-muted">{detail}</div>}
        </div>
        {children}
      </div>
    </li>
  );
}


async function Landing({ error }: { error?: string }) {
  await dbReady;
  const [[{ n: members }], t, locale] = await Promise.all([db.select({ n: count() }).from(schema.users), getT(), getLocale()]);
  // `error` is a code from the sign-in callback; never show the raw query value.
  const errorText = error ? (Object.hasOwn(t.auth.errors, error) ? t.auth.errors[error as keyof typeof t.auth.errors] : t.auth.errors.failed) : null;
  return (
    <main className="mx-auto max-w-md min-h-dvh flex flex-col justify-center py-10 gap-8">
      <div className="space-y-3">
        <h1>
          <Wordmark size="text-5xl" />
        </h1>
        <p className="text-lg text-muted">{t.now.landing.tagline}</p>
      </div>
      <ol className="space-y-2 text-sm text-muted">
        {t.now.landing.steps.map((step, i) => (
          <li key={i} className="flex gap-3"><span className="font-bold text-foreground">{i + 1}</span> {step}</li>
        ))}
      </ol>
      {errorText && <p className="bg-busy/10 text-busy px-4 py-3 text-sm">{errorText}</p>}
      <SignIn />
      <Fineprint />
      {/* Quiet social proof; hidden until there's a crowd worth mentioning. */}
      {members >= 10 && <p className="text-xs text-muted tabular-nums">{t.now.landing.members(members.toLocaleString(LOCALE_TAGS[locale]), members)}</p>}
      <LanguagePicker current={locale} quiet />
    </main>
  );
}
