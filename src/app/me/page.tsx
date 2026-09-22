import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getCalendar } from "@/lib/calendar";
import { relativeAge, nowMs } from "@/lib/time";
import { Avatar } from "@/components/Avatar";
import { CalendarLinkForm } from "@/components/CalendarLinkForm";
import { refreshMyCalendar, removeMyCalendar, setVisibility, signOut } from "@/app/actions";
import type { Visibility } from "@/db/schema";

export const metadata: Metadata = { title: "Settings" };

const OPTIONS: { value: Visibility; title: string; desc: string }[] = [
  { value: "everyone", title: "Everyone at EPFL (default)", desc: "Anyone signed in sees your timetable, like a shared work calendar." },
  { value: "connections", title: "Connections see details", desc: "Everyone sees free/busy; only people you accept see courses and rooms." },
  { value: "private", title: "Connections only", desc: "Hidden from search. Only people you’ve accepted can see anything." },
];

export default async function MePage() {
  const user = await requireUser();
  const cal = await getCalendar(user.id);
  const now = nowMs();

  return (
    <main className="mx-auto max-w-2xl py-6 md:py-10 space-y-6">
      <header className="flex items-center gap-3">
        <Avatar name={user.name} image={user.image} size={52} />
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight truncate">{user.name}</h1>
          <p className="text-sm text-muted truncate">{user.email}</p>
        </div>
      </header>

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
            <button type="submit" className="w-full rounded-xl bg-foreground text-background py-2.5 text-sm font-semibold active:opacity-80">
              Save
            </button>
          </div>
        </form>
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
                <button className="w-full rounded-xl border border-line py-2.5 text-sm font-semibold active:opacity-70">Refresh now</button>
              </form>
              <Link href={`/u/${user.id}`} className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold text-center active:opacity-70">
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
              <button className="text-sm text-busy font-medium">Remove my schedule</button>
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
        <button className="w-full rounded-2xl border border-line py-3 text-sm font-semibold text-muted active:opacity-70">Sign out</button>
      </form>
    </main>
  );
}
