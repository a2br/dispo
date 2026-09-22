import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { features } from "@/lib/features";
import { peopleInCourse } from "@/lib/classmates";
import { connectionsOf, statusesFor } from "@/lib/calendar";
import type { Relation } from "@/lib/access";
import { publicPerson } from "@/lib/present";
import { BackButton } from "@/components/BackButton";
import { ConnectButton } from "@/components/ConnectButton";
import { CourseChip } from "@/components/CourseChips";
import { PersonRow } from "@/components/PersonRow";

export async function generateMetadata({ params }: PageProps<"/discover/[key]">): Promise<Metadata> {
  const { key } = await params;
  return { title: decodeURIComponent(key) };
}

export default async function DiscoverCoursePage({ params }: PageProps<"/discover/[key]">) {
  if (!features.classmates) notFound();
  const user = await requireUser();
  const { key } = await params;
  const res = await peopleInCourse(user, decodeURIComponent(key));
  if (!res) notFound();
  const conns = await connectionsOf(user.id);
  const accepted = new Set(conns.accepted.map((u) => u.id));
  const outgoing = new Set(conns.outgoing.map((u) => u.id));
  const incoming = new Set(conns.incoming.map((u) => u.id));
  const strangers = res.people.filter((p) => !accepted.has(p.id));
  const friendsHere = res.people.length - strangers.length;
  const statuses = await statusesFor(strangers.map((p) => p.id));
  const relation = (id: string): Relation => (incoming.has(id) ? { kind: "incoming" } : outgoing.has(id) ? { kind: "outgoing" } : { kind: "none" });

  return (
    <main className="mx-auto max-w-3xl py-6 md:py-10 space-y-5">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <BackButton href="/discover" label="Discover" />
          <CourseChip course={res.course} link={false} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{res.course.name}</h1>
        <p className="text-sm text-muted">
          {strangers.length === 0 ? "Nobody new here yet." : `${strangers.length} ${strangers.length === 1 ? "person" : "people"} you don’t know yet`}
          {friendsHere > 0 && ` · ${friendsHere} of your people also take it`}
        </p>
      </header>
      {strangers.length > 0 && (
        <ul className="border border-line divide-y divide-line">
          {strangers.map((p) => (
            <PersonRow key={p.id} person={publicPerson(p, statuses.get(p.id) ?? { state: "unknown" })} trailing={<ConnectButton userId={p.id} rel={relation(p.id)} />} />
          ))}
        </ul>
      )}
    </main>
  );
}
