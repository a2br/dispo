import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { features } from "@/lib/features";
import { peopleInCourse } from "@/lib/classmates";
import { statusesFor } from "@/lib/calendar";
import { publicPerson } from "@/lib/present";
import { PersonRow } from "@/components/PersonRow";
import { CourseChip } from "@/components/CourseChips";

export async function generateMetadata({ params }: PageProps<"/course/[key]">): Promise<Metadata> {
  const { key } = await params;
  return { title: decodeURIComponent(key) };
}

export default async function CoursePage({ params }: PageProps<"/course/[key]">) {
  if (!features.classmates) notFound();
  const user = await requireUser();
  const { key } = await params;
  const res = await peopleInCourse(user, decodeURIComponent(key));
  if (!res) notFound();
  const { course, people } = res;
  const statuses = await statusesFor(people.map((p) => p.id));

  return (
    <main className="mx-auto max-w-3xl py-6 md:py-10 space-y-5">
      <header className="space-y-2">
        <Link href="/classmates" className="text-sm text-accent">‹ Classmates</Link>
        <div className="flex items-center gap-2">
          <CourseChip course={course} link={false} />
          <span className="text-xs text-muted">{course.sessions} sessions this semester</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{course.name}</h1>
      </header>

      <section>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
          {people.length === 0 ? "Nobody else yet" : people.length === 1 ? "1 person you can see" : `${people.length} people you can see`}
        </h2>
        {people.length > 0 && (
          <ul className="rounded-2xl bg-surface border border-line divide-y divide-line">
            {people.map((p) => (
              <PersonRow key={p.id} person={publicPerson(p, statuses.get(p.id) ?? { state: "unknown" })} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
