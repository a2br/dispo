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

export default async function Home({ searchParams }: PageProps<"/">) {
  const user = await getUser();
  const sp = await searchParams;
  if (!user) return <Landing error={typeof sp.error === "string" ? sp.error : undefined} />;

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
  const view = (u: (typeof conns.accepted)[number]) => publicPerson(u, statuses.get(u.id) ?? { state: "unknown" });
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
    <main className="py-6 md:py-10 space-y-6">
      {invites.length > 0 && <GroupInviteModal invite={invites[0]} more={invites.length - 1} />}
      <header className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Who’s free?</h1>
        <LiveClock now={now} className="text-xs md:text-sm text-muted whitespace-nowrap" />
      </header>

      {!onboarding && !user.hideInviteCard && (
        <section className={`${card} relative flex flex-wrap items-center gap-x-4 gap-y-3 p-4 pr-12`}>
          <div className="flex-1 min-w-[12rem]">
            <h2 className="font-bold">Invite friends</h2>
            <p className="text-sm text-muted">Whoever signs up through your link is connected with you straight away.</p>
          </div>
          <ShareLinkButton url={inviteUrl} title="Join me on dispo" text="See when we’re both free between classes:" label="Share my link" variant="primary" />
          <form action={dismissInviteCard} className="absolute top-2 right-2">
            <button className={iconButton("quiet")} aria-label="Hide invite card" title="Hide">
              <CloseIcon />
            </button>
          </form>
        </section>
      )}

      {/* Front and center: anyone at EPFL, on dispo or not (not-yet-members can be invited). */}
      <section className="space-y-1.5">
        <SearchBox inviteUrl={inviteUrl} placeholder="Find anyone at EPFL" />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        {/* Main column: you, then your people split into free now / busy */}
        <div className="space-y-6 min-w-0">
          {onboarding && (
            <section className={`${card} p-4 space-y-4`}>
              <div>
                <h2 className="font-bold text-lg">Get dispo going</h2>
                <p className="text-sm text-muted">Two steps and your friends’ free time shows up here.</p>
              </div>
              <ol className="space-y-3">
                <Step n={1} done={Boolean(cal)} title="Add your schedule" detail="Copy your calendar link from IS-Academia and paste it once; it stays in sync.">
                  {!cal && (
                    <Link href="/setup" className={button("primary")}>
                      Add schedule
                    </Link>
                  )}
                </Step>
                <Step n={2} done={conns.accepted.length > 0} title="Bring your people" detail="Find people above, or send your link. Whoever signs up through it is connected with you automatically.">
                  {conns.accepted.length === 0 && (
                    <ShareLinkButton url={inviteUrl} title="Join me on dispo" text="See when we’re both free between classes:" label="Share my link" variant={cal ? "primary" : "secondary"} />
                  )}
                </Step>
              </ol>
            </section>
          )}

          {conns.incoming.length > 0 && (
            <section>
              <h2 className={`${sectionTitle} mb-2`}>Wants to connect</h2>
              <ul className={`${card} divide-y divide-line`}>
                {conns.incoming.map((u) => (
                  <PersonRow
                    key={u.id}
                    person={view(u)}
                    trailing={
                      <div className="flex gap-2">
                        <form action={acceptConnection}>
                          <input type="hidden" name="userId" value={u.id} />
                          <button className={button("success")}>Accept</button>
                        </form>
                        <form action={removeConnection}>
                          <input type="hidden" name="userId" value={u.id} />
                          <button className={iconButton("secondary")} aria-label="Decline">
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
                  Your people <span className="font-normal normal-case tracking-normal">· {freeCount} free now</span>
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
              <h2 className={sectionTitle}>Groups</h2>
              <Link href="/groups/new" className={button("secondary")}>
                Create group
              </Link>
            </div>
            {groups.length > 0 ? (
              <GroupCards groups={sortedGroups} next={groupNext} now={now} pinned={stars.groups} locked={!cal} />
            ) : (
              <p className={`${card} px-4 py-4 text-sm text-muted`}>A group is like a group chat for finding a time: everyone in it sees when you’re all free, and it comes with a link for your chat.</p>
            )}
          </section>


          {features.classmates && user.discoverable && mine.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <h2 className={sectionTitle}>Classmates</h2>
                <Link href="/discover" className="text-sm link">
                  Discover
                </Link>
              </div>
              {shownClassmates.length === 0 ? (
                <div className={`${card} px-4 py-6 text-center text-muted text-sm`}>Nobody who shares your courses has joined yet.</div>
              ) : (
                <ul className={`${card} divide-y divide-line`}>
                  {shownClassmates.map((m) => (
                    <PersonRow
                      key={m.user.id}
                      person={publicPerson(m.user, classmateStatuses.get(m.user.id) ?? { state: "unknown" })}
                      trailing={
                        <span className="text-sm font-bold tabular-nums whitespace-nowrap" title={`${m.shared.length} of your ${mine.length} courses`}>
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
                  See all {suggested.length} in Discover
                </Link>
              )}
            </section>
          )}

          {conns.outgoing.length > 0 && (
            <section>
              <h2 className={`${sectionTitle} mb-2`}>Requested</h2>
              <ul className={`${card} divide-y divide-line`}>
                {conns.outgoing.map((u) => (
                  <PersonRow key={u.id} person={view(u)} trailing={<span className="text-xs text-muted">pending</span>} />
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
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


function Landing({ error }: { error?: string }) {
  return (
    <main className="mx-auto max-w-md min-h-dvh flex flex-col justify-center py-10 gap-8">
      <div className="space-y-3">
        <h1>
          <Wordmark size="text-5xl" />
        </h1>
        <p className="text-lg text-muted">Who’s free right now? See your friends’ EPFL timetables the way you’d peek at a coworker’s calendar.</p>
      </div>
      <ol className="space-y-2 text-sm text-muted">
        <li className="flex gap-3"><span className="font-bold text-foreground">1</span> Sign in with your EPFL Google account.</li>
        <li className="flex gap-3"><span className="font-bold text-foreground">2</span> Copy your calendar link from IS-Academia and paste it, once.</li>
        <li className="flex gap-3"><span className="font-bold text-foreground">3</span> Invite friends or a group chat and see when everyone’s free.</li>
      </ol>
      {error && <p className="bg-busy/10 text-busy px-4 py-3 text-sm">{error}</p>}
      <SignIn />
      <Fineprint />
    </main>
  );
}
