import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { connectionsOf } from "@/lib/calendar";
import { starsOf } from "@/lib/stars";
import { shareAGroup } from "@/lib/groups";
import { usersByIds } from "@/lib/invites";
import { button, input, sectionTitle } from "@/lib/ui";
import { createGroupAction } from "@/app/actions";
import { BackButton } from "@/components/BackButton";
import { PeopleChecklist } from "@/components/PeopleChecklist";

export const metadata: Metadata = { title: "New group" };

/** The one way to make a group: name it, pick people (optional), get its invite link. */
export default async function NewGroupPage({ searchParams }: PageProps<"/groups/new">) {
  const user = await requireUser();
  const sp = await searchParams;
  const preselected = typeof sp.with === "string" ? sp.with.split(",").filter(Boolean) : [];
  const back = typeof sp.from === "string" && sp.from.startsWith("/") && !sp.from.startsWith("//") ? sp.from : "/";
  const [conns, stars] = await Promise.all([connectionsOf(user.id), starsOf(user.id)]);
  // People you were just looking at in the calendar may be group-mates rather than connections: list them too.
  const extraIds = preselected.filter((id) => !conns.accepted.some((u) => u.id === id));
  const extras = (await usersByIds(extraIds)).filter(Boolean);
  const allowedExtras: typeof extras = [];
  for (const u of extras) if (await shareAGroup(user.id, u.id)) allowedExtras.push(u);
  const people = [...allowedExtras, ...conns.accepted].sort(
    (a, b) => Number(preselected.includes(b.id)) - Number(preselected.includes(a.id)) || Number(stars.users.has(b.id)) - Number(stars.users.has(a.id)) || a.name.localeCompare(b.name),
  );
  const suggestion = people.filter((p) => preselected.includes(p.id)).map((p) => p.name.split(" ")[0]).join(", ");

  return (
    <main className="mx-auto max-w-xl py-6 md:py-10">
      <form action={createGroupAction} className="space-y-6">
        <header className="flex items-center gap-3">
          <BackButton href={back} label="previous page" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">New group</h1>
        </header>
        <p className="text-muted">Like a group chat: everyone in it sees it and can find a time together. You’ll get a link to invite anyone else.</p>

        <label className="block space-y-1.5">
          <span className={sectionTitle}>Name</span>
          <input name="name" required maxLength={60} defaultValue={suggestion} placeholder="e.g. ADA project, Sat climbing" className={input("md")} autoFocus={!suggestion} />
        </label>

        <section className="space-y-2">
          <h2 className={sectionTitle}>Add your people {people.length > 0 && <span className="normal-case font-normal tracking-normal">· optional</span>}</h2>
          {people.length ? (
            <PeopleChecklist people={people} checked={preselected} />
          ) : (
            <p className="text-sm text-muted border border-line px-4 py-4">You’re not connected with anyone yet. Create the group and share its link instead.</p>
          )}
        </section>

        <button type="submit" className={button("primary", "lg", "w-full")}>
          Create group
        </button>
      </form>
    </main>
  );
}
