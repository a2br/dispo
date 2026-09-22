import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { features } from "@/lib/features";
import { classmatesFor } from "@/lib/classmates";
import { statusesFor } from "@/lib/calendar";
import { publicPerson } from "@/lib/present";
import { PersonRow } from "@/components/PersonRow";
import { CourseChip, CourseChips } from "@/components/CourseChips";

export const metadata: Metadata = { title: "Classmates" };

export default async function ClassmatesPage() {
  if (!features.classmates) notFound();
  const user = await requireUser();
  const { mine, classmates } = await classmatesFor(user);
  const statuses = await statusesFor(classmates.map((c) => c.user.id));

  if (mine.length === 0) {
    return (
      <main className="mx-auto max-w-3xl py-6 md:py-10 space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Classmates</h1>
        <div className="rounded-2xl bg-surface border border-line px-4 py-10 text-center space-y-3">
          <p className="text-muted">Add your schedule first and we’ll find who shares your courses.</p>
          <Link href="/setup" className="inline-block rounded-full bg-accent text-white px-5 py-2.5 font-semibold">Add my schedule</Link>
        </div>
      </main>
    );
  }

  const perCourse = mine.map((c) => ({ course: c, count: classmates.filter((m) => m.shared.some((s) => s.key === c.key)).length }));

  return (
    <main className="mx-auto max-w-3xl py-6 md:py-10 space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Classmates</h1>
        <p className="text-sm text-muted mt-1">People who share your courses, most overlap first. Only the courses you have in common are shown.</p>
      </header>

      <section>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">Your courses</h2>
        <ul className="rounded-2xl bg-surface border border-line divide-y divide-line">
          {perCourse.map(({ course, count }) => (
            <li key={course.key}>
              <Link href={`/course/${encodeURIComponent(course.key)}`} className="flex items-center gap-3 px-4 py-3 active:opacity-70">
                <CourseChip course={course} link={false} />
                <span className="flex-1 min-w-0 truncate">{course.name}</span>
                <span className="text-sm text-muted tabular-nums whitespace-nowrap">{count === 0 ? "nobody yet" : count === 1 ? "1 person" : `${count} people`}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">People</h2>
        {classmates.length === 0 ? (
          <div className="rounded-2xl bg-surface border border-line px-4 py-8 text-center text-muted text-sm">
            Nobody who has signed in shares a course with you yet. Send the link to your section.
          </div>
        ) : (
          <ul className="rounded-2xl bg-surface border border-line divide-y divide-line">
            {classmates.map((m) => (
              <PersonRow key={m.user.id} person={publicPerson(m.user, statuses.get(m.user.id) ?? { state: "unknown" })} trailing={<span className="text-sm font-semibold tabular-nums whitespace-nowrap">
                      {m.shared.length}/{mine.length}
                    </span>} footer={<CourseChips courses={m.shared} />} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
