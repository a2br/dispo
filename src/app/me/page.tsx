import type { Metadata } from "next";
import Link from "next/link";
import { appUrl, requireUser } from "@/lib/auth";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import { eventsBetween, getCalendar, statusFrom } from "@/lib/calendar";
import { statusView } from "@/lib/present";
import { StatusPill } from "@/components/StatusPill";
import { dayStartOf, relativeAge, nowMs } from "@/lib/time";
import { Avatar } from "@/components/Avatar";
import { DiscoverToggle } from "@/components/DiscoverToggle";
import { PhoneForm } from "@/components/PhoneForm";
import { button, card, sectionTitle } from "@/lib/ui";
import { CalendarLinkForm } from "@/components/CalendarLinkForm";
import { refreshMyCalendar, removeMyCalendar, setPublicLink, setVisibility, signOut } from "@/app/actions";
import type { Visibility } from "@/db/schema";

export const metadata: Metadata = { title: "Me" };

const OPTIONS: { value: Visibility; title: string; desc: string }[] = [
  { value: "everyone", title: "Everyone at EPFL (default)", desc: "Anyone signed in sees your timetable, like a shared work calendar." },
  { value: "connections", title: "Connections see details", desc: "Everyone sees free/busy; only people you accept see courses and rooms." },
  { value: "private", title: "Connections only", desc: "Hidden from search. Only people you’ve accepted can see anything." },
];

export default async function MePage() {
  const user = await requireUser();
  const cal = await getCalendar(user.id);
  const today = cal ? await eventsBetween(user.id, dayStartOf(nowMs()), dayStartOf(nowMs()) + 86_400_000) : [];
  const now = nowMs();

  return (
    <main className="mx-auto max-w-2xl py-6 md:py-10 space-y-6">
      <header className="flex items-center gap-3">
        <Avatar name={user.name} image={user.image} size={52} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight truncate">{user.name}</h1>
          <p className="text-sm text-muted truncate">{user.email}</p>
        </div>
      </header>

      {cal && (
        <Link href="/calendar" className={`${card} group flex items-center gap-3 px-4 py-3 hover:border-foreground`}>
          <span className="flex-1 min-w-0">
            <span className={`${sectionTitle} block mb-0.5`}>Right now</span>
            <StatusPill status={statusView(statusFrom(today, now), "full")} />
          </span>
          <span className="text-sm link whitespace-nowrap">My week</span>
        </Link>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Who can see my schedule</h2>
        <form action={setVisibility} className="rounded-2xl bg-surface border border-line divide-y divide-line">
          {OPTIONS.map((o) => (
            <label key={o.value} className="flex items-start gap-3 px-4 py-3 cursor-pointer">
              <input type="radio" name="visibility" value={o.value} defaultChecked={user.visibility === o.value} className="mt-1 accent-[var(--accent)]" />
              <span className="flex-1">
                <span className="block font-medium">{o.title}</span>
                <span className="block text-sm text-muted">{o.desc}</span>
              </span>
            </label>
          ))}
          <div className="px-4 py-3">
            <button type="submit" className={button("dark", "md", "w-full")}>
              Save
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>Public link</h2>
        <div className={`${card} p-4 space-y-3`}>
          <p className="text-sm text-muted">
            A view-only link to your week that anyone can open without signing up: free/busy only, no course names or rooms.
          </p>
          {user.shareCode ? (
            <div className="flex flex-wrap items-center gap-2">
              <ShareLinkButton url={`${appUrl()}/s/${user.shareCode}`} title={`${user.name.split(" ")[0]}’s week`} text="When I’m free this week:" label="Share link" variant="primary" />
              <a href={`/s/${user.shareCode}`} target="_blank" rel="noopener" className={button("secondary")}>
                Preview ↗
              </a>
              <form action={setPublicLink}>
                <input type="hidden" name="on" value="1" />
                <button className={button("quiet")} title="Make a new link; the old one stops working">
                  Reset link
                </button>
              </form>
              <form action={setPublicLink}>
                <input type="hidden" name="on" value="0" />
                <button className={button("danger")}>Turn off</button>
              </form>
            </div>
          ) : (
            <form action={setPublicLink}>
              <input type="hidden" name="on" value="1" />
              <button className={button("secondary")}>Create public link</button>
            </form>
          )}
        </div>
      </section>

      <section id="discover" className="space-y-2 scroll-mt-6">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Discover</h2>
        <div className="rounded-2xl bg-surface border border-line">
          <DiscoverToggle on={user.discoverable} />
          <PhoneForm phone={user.phone} />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Calendar link</h2>
        {cal ? (
          <div className="rounded-2xl bg-surface border border-line divide-y divide-line">
            <div className="px-4 py-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted">Sessions loaded</span><span className="font-medium tabular-nums">{cal.eventCount}</span></div>
              <div className="flex justify-between"><span className="text-muted">Last synced</span><span className="font-medium">{relativeAge(cal.lastOkAt, now)}</span></div>
              {cal.lastError && <p className="text-busy text-xs pt-1">Last refresh failed: {cal.lastError}</p>}
            </div>
            <div className="px-4 py-3 flex gap-2">
              <form action={refreshMyCalendar} className="flex-1">
                <button className={button("secondary", "md", "w-full")}>Refresh now</button>
              </form>
              <Link href={`/u/${user.id}`} className={button("secondary", "md", "flex-1")}>
                View my week
              </Link>
            </div>
            <details className="px-4 py-3">
              <summary className="text-sm font-medium cursor-pointer">Replace the link</summary>
              <div className="pt-3">
                <CalendarLinkForm stay compact />
              </div>
            </details>
            <form action={removeMyCalendar} className="px-4 py-3">
              <button className={button("danger", "sm", "-ml-3")}>Remove my schedule</button>
            </form>
          </div>
        ) : (
          <div className="rounded-2xl bg-surface border border-line p-4 space-y-3">
            <p className="text-sm text-muted">No calendar yet.</p>
            <CalendarLinkForm />
          </div>
        )}
      </section>

      <form action={signOut}>
        <button className={button("secondary", "md", "w-full text-muted")}>Sign out</button>
      </form>
    </main>
  );
}
