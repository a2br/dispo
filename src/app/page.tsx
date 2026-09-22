import Link from "next/link";
import { nowMs } from "@/lib/time";
import { devLoginEnabled, getUser, googleConfigured } from "@/lib/auth";
import { connectionsOf, getCalendar, statusesFor, todayBlocksFor, usersWithCalendar } from "@/lib/calendar";
import { listGroups } from "@/lib/groups";
import { dayStartOf } from "@/lib/time";
import { GroupCards } from "@/components/GroupCards";
import { TodayScale, TodayStrip } from "@/components/TodayStrip";
import { publicPerson } from "@/lib/present";
import { classmatesFor } from "@/lib/classmates";
import { features } from "@/lib/features";
import { PersonRow } from "@/components/PersonRow";
import { SearchBox } from "@/components/SearchBox";
import { acceptConnection, removeConnection } from "./actions";

export default async function Home({ searchParams }: PageProps<"/">) {
  const user = await getUser();
  const sp = await searchParams;
  if (!user) return <Landing error={typeof sp.error === "string" ? sp.error : undefined} />;

  const now = nowMs();
  const [cal, conns, groups, { mine, classmates }] = await Promise.all([
    getCalendar(user.id),
    connectionsOf(user.id),
    listGroups(user.id),
    features.classmates ? classmatesFor(user) : Promise.resolve({ mine: [], classmates: [] }),
  ]);
  const ids = [...new Set([user.id, ...conns.accepted, ...conns.incoming, ...conns.outgoing, ...groups.flatMap((g) => g.members)].map((u) => (typeof u === "string" ? u : u.id)))];
  const [statuses, blocks, calIds] = await Promise.all([statusesFor(ids), todayBlocksFor(conns.accepted.map((u) => u.id), now), usersWithCalendar(conns.accepted.map((u) => u.id))]);
  const view = (u: (typeof conns.accepted)[number]) => publicPerson(u, statuses.get(u.id) ?? { state: "unknown" });

  const accepted = conns.accepted.map((u) => ({ u, p: view(u) })).sort((a, b) => rank(a.p.status.state) - rank(b.p.status.state) || a.p.name.localeCompare(b.p.name));
  const dayStart = dayStartOf(now);

  return (
    <main className="py-6 md:py-10 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Who’s free?</h1>
        <span className="text-xs md:text-sm text-muted">{new Intl.DateTimeFormat("en-GB", { weekday: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Zurich" }).format(now)}</span>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        {/* Side column (first on phones): search, find a time, groups, requests */}
        <div className="space-y-6 xl:order-2 xl:sticky xl:top-10">
          {!cal && (
            <Link href="/setup" className="block rounded-2xl bg-accent text-white px-4 py-3 active:opacity-80">
              <div className="font-semibold">Add your schedule</div>
              <div className="text-sm opacity-90">Paste your EPFL Campus calendar link so people can see when you’re free.</div>
            </Link>
          )}

          <SearchBox />

          {conns.accepted.length > 0 && groups.length === 0 && (
            <Link href="/calendar" className="flex items-center gap-3 rounded-2xl bg-foreground text-background px-4 py-3 active:opacity-80">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6 shrink-0">
                <rect x="3" y="5" width="18" height="16" rx="3" />
                <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
                <path d="m9 15 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="flex-1">
                <span className="block font-semibold">Find a time together</span>
                <span className="block text-sm opacity-75">Open your calendar and add friends</span>
              </span>
              <span aria-hidden>›</span>
            </Link>
          )}

          {groups.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Groups</h2>
                <Link href="/calendar" className="text-sm text-accent">New</Link>
              </div>
              <GroupCards groups={groups} statuses={statuses} you={statuses.get(user.id) ?? { state: "unknown" }} />
            </section>
          )}

          {conns.incoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">Wants to connect</h2>
              <ul className="rounded-2xl bg-surface border border-line divide-y divide-line">
                {conns.incoming.map((u) => (
                  <PersonRow
                    key={u.id}
                    person={view(u)}
                    trailing={
                      <div className="flex gap-1.5">
                        <form action={acceptConnection}>
                          <input type="hidden" name="userId" value={u.id} />
                          <button className="rounded-full bg-free text-white text-sm font-semibold px-3 py-1.5">Accept</button>
                        </form>
                        <form action={removeConnection}>
                          <input type="hidden" name="userId" value={u.id} />
                          <button className="rounded-full border border-line text-sm text-muted px-3 py-1.5" aria-label="Decline">✕</button>
                        </form>
                      </div>
                    }
                  />
                ))}
              </ul>
            </section>
          )}

          {mine.length > 0 && (
            <Link href="/classmates" className="flex items-center gap-3 rounded-2xl bg-surface border border-line px-4 py-3 active:opacity-70">
              <span className="flex-1 text-sm">
                {classmates.length === 0
                  ? "Nobody who shares your courses has signed in yet."
                  : `${classmates.length} ${classmates.length === 1 ? "person shares" : "people share"} some of your classes`}
              </span>
              <span className="text-sm text-accent whitespace-nowrap">Classes ›</span>
            </Link>
          )}
        </div>

        {/* Main column: your people, with today's timeline on wide screens */}
        <div className="space-y-6 xl:order-1 min-w-0">
          <section>
            <div className="flex items-end gap-3 mb-2">
              <h2 className="flex-1 text-sm font-semibold text-muted uppercase tracking-wide">Your people</h2>
              {accepted.length > 0 && (
                <div className="hidden md:block w-56 lg:w-80 xl:w-72 shrink-0 mr-4">
                  <TodayScale />
                </div>
              )}
            </div>
            {accepted.length === 0 ? (
              <div className="rounded-2xl bg-surface border border-line px-4 py-8 text-center text-muted text-sm">
                Nobody yet. Search a name and tap Connect to keep them here.
              </div>
            ) : (
              <ul className="rounded-2xl bg-surface border border-line divide-y divide-line">
                {accepted.map(({ u, p }) => (
                  <PersonRow
                    key={u.id}
                    person={p}
                    trailing={
                      <div className="hidden md:block w-56 lg:w-80 xl:w-72 shrink-0">
                        <TodayStrip blocks={blocks.get(u.id) ?? []} dayStart={dayStart} now={now} known={calIds.has(u.id)} />
                      </div>
                    }
                  />
                ))}
              </ul>
            )}
          </section>

          {conns.outgoing.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">Requested</h2>
              <ul className="rounded-2xl bg-surface border border-line divide-y divide-line">
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

function rank(s: "free" | "busy" | "unknown") {
  return s === "free" ? 0 : s === "busy" ? 1 : 2;
}

function Landing({ error }: { error?: string }) {
  const google = googleConfigured();
  const dev = devLoginEnabled();
  return (
    <main className="mx-auto max-w-md min-h-dvh flex flex-col justify-center py-10 gap-8">
      <div className="space-y-3">
        <div className="size-14 rounded-2xl bg-accent grid place-items-center text-white text-2xl font-black">d</div>
        <h1 className="text-4xl font-bold tracking-tight">dispo</h1>
        <p className="text-lg text-muted">
          Who’s free right now? See your friends’ EPFL timetables the way you’d peek at a coworker’s calendar.
        </p>
      </div>
      <ol className="space-y-2 text-sm text-muted">
        <li className="flex gap-3"><span className="font-semibold text-foreground">1</span> Sign in with your EPFL Google account.</li>
        <li className="flex gap-3"><span className="font-semibold text-foreground">2</span> Paste the calendar link from the EPFL Campus app, once.</li>
        <li className="flex gap-3"><span className="font-semibold text-foreground">3</span> Search anyone by name and see when they’re free.</li>
      </ol>
      {error && <p className="rounded-2xl bg-busy/10 text-busy px-4 py-3 text-sm">{error}</p>}
      <div className="space-y-3">
        <a
          href="/api/auth/google"
          aria-disabled={!google}
          className={`flex items-center justify-center gap-3 rounded-2xl py-3.5 font-semibold ${google ? "bg-foreground text-background active:opacity-80" : "bg-surface border border-line text-muted pointer-events-none"}`}
        >
          <GoogleG />
          Continue with EPFL Google
        </a>
        {!google && <p className="text-xs text-muted text-center">Google sign-in isn’t configured on this server yet (set GOOGLE_CLIENT_ID / SECRET).</p>}
        {dev && <DevLogin />}
      </div>
      <p className="text-xs text-muted">Only @epfl.ch accounts. Your calendar link is stored encrypted and never shown to anyone.</p>
    </main>
  );
}

function DevLogin() {
  return (
    <form action="/api/auth/dev" method="get" className="rounded-2xl border border-dashed border-line p-3 space-y-2">
      <div className="text-xs font-semibold text-muted uppercase tracking-wide">Dev login (local only)</div>
      <div className="flex gap-2">
        <input name="name" placeholder="Name" className="flex-1 min-w-0 rounded-xl bg-surface border border-line px-3 py-2 text-sm" />
        <input name="email" type="email" required placeholder="you@epfl.ch" className="flex-1 min-w-0 rounded-xl bg-surface border border-line px-3 py-2 text-sm" />
        <button className="rounded-xl bg-surface border border-line px-3 py-2 text-sm font-medium">Go</button>
      </div>
    </form>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="size-5">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.4 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.8-.4-4H24v7.6h12.9c-.3 2.1-1.7 5.3-4.8 7.4l7.4 5.7c4.4-4.1 7-10.1 7-16.7z" />
      <path fill="#FBBC05" d="M10.4 28.7A14.6 14.6 0 0 1 9.6 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2 1.4-4.7 2.4-8.5 2.4-6.3 0-11.7-4-13.6-9.9l-7.8 6C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}
