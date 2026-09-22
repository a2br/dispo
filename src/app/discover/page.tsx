import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "@/components/Icons";
import { notFound } from "next/navigation";
import { visibleStatuses } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { features } from "@/lib/features";
import { classmatesFor } from "@/lib/classmates";
import { connectionsOf } from "@/lib/calendar";
import type { Relation } from "@/lib/access";
import { publicPerson } from "@/lib/present";
import { BackButton } from "@/components/BackButton";
import { ConnectButton } from "@/components/ConnectButton";
import { CourseChip, CourseChips } from "@/components/CourseChips";
import { PersonRow } from "@/components/PersonRow";
import { ReachLinks } from "@/components/ReachLinks";
import { button } from "@/lib/ui";

export const metadata: Metadata = { title: "Discover" };

/** Subscreen of People for meeting new people: only people you're not connected to, ranked by shared courses. */
export default async function DiscoverPage() {
  if (!features.classmates) notFound();
  const user = await requireUser();

  const header = (
    <header className="space-y-1">
      <div className="flex items-center gap-3">
        <BackButton href="/" label="Now" />
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Discover</h1>
      </div>
      <p className="text-sm text-muted">People who share your courses and aren’t in your people yet. Only the courses you have in common are shown.</p>
    </header>
  );

  if (!user.discoverable) {
    return (
      <main className="mx-auto max-w-3xl py-6 md:py-10 space-y-5">
        {header}
        <div className="border border-line px-4 py-8 text-center space-y-2">
          <p className="text-muted">You’ve turned Discover off, so you don’t appear here for others and don’t see them.</p>
          <Link href="/me#discover" className="link text-sm">Turn it back on in Me</Link>
        </div>
      </main>
    );
  }

  const [{ mine, classmates }, conns] = await Promise.all([classmatesFor(user), connectionsOf(user.id)]);
  const accepted = new Set(conns.accepted.map((u) => u.id));
  const outgoing = new Set(conns.outgoing.map((u) => u.id));
  const incoming = new Set(conns.incoming.map((u) => u.id));
  const strangers = classmates.filter((c) => !accepted.has(c.user.id));
  const statuses = await visibleStatuses(user, strangers.map((c) => c.user));
  const relation = (id: string): Relation => (incoming.has(id) ? { kind: "incoming" } : outgoing.has(id) ? { kind: "outgoing" } : { kind: "none" });
  const perCourse = mine.map((c) => ({ course: c, count: strangers.filter((m) => m.shared.some((s) => s.key === c.key)).length }));

  if (mine.length === 0) {
    return (
      <main className="mx-auto max-w-3xl py-6 md:py-10 space-y-5">
        {header}
        <div className="border border-line px-4 py-10 text-center space-y-3">
          <p className="text-muted">Add your schedule first to find people who share your courses.</p>
          <Link href="/setup" className={button("primary")}>Add my schedule</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl py-6 md:py-10 space-y-6">
      {header}

      <section>
        <h2 className="text-sm font-bold text-muted uppercase tracking-wide mb-2">People</h2>
        {strangers.length === 0 ? (
          <div className="border border-line px-4 py-8 text-center text-muted text-sm">Nobody new shares your courses yet. Invite your section from the search on People.</div>
        ) : (
          <ul className="border border-line divide-y divide-line">
            {strangers.map((m) => (
              <PersonRow
                key={m.user.id}
                person={publicPerson(m.user, statuses.get(m.user.id) ?? { state: "unknown" })}
                trailing={<ConnectButton userId={m.user.id} rel={relation(m.user.id)} />}
                footer={
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold tabular-nums">
                      {m.shared.length}/{mine.length} courses
                    </span>
                    <CourseChips courses={m.shared} />
                    {m.user.phone && <ReachLinks phone={m.user.phone} />}
                  </span>
                }
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-bold text-muted uppercase tracking-wide mb-2">By course</h2>
        <ul className="border border-line divide-y divide-line">
          {perCourse.map(({ course, count }) => (
            <li key={course.key}>
              <Link href={`/discover/${encodeURIComponent(course.key)}`} className="group flex items-center gap-3 px-4 py-3 hover:bg-subtle">
                <CourseChip course={course} link={false} />
                <span className="flex-1 min-w-0 truncate group-hover:text-accent-ink">{course.name}</span>
                <span className="text-sm text-muted tabular-nums whitespace-nowrap">{count === 0 ? "nobody new" : count === 1 ? "1 person" : `${count} people`}</span>
                <ChevronRight className="size-4 text-muted shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
