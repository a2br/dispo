import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { connectionsOf } from "@/lib/calendar";
import { starsOf } from "@/lib/stars";
import { button, input, sectionTitle } from "@/lib/ui";
import { createGroupAction } from "@/app/actions";
import { BackButton } from "@/components/BackButton";
import { PeopleAdder } from "@/components/PeopleAdder";

export const metadata: Metadata = { title: "Create group" };

/** The one way to make a group, always on purpose: name it, pick people (optional), get its invite link. */
export default async function CreateGroupPage() {
  const user = await requireUser();
  const [conns, stars] = await Promise.all([connectionsOf(user.id), starsOf(user.id)]);
  const people = [...conns.accepted].sort((a, b) => Number(stars.users.has(b.id)) - Number(stars.users.has(a.id)) || a.name.localeCompare(b.name));

  return (
    <main className="mx-auto max-w-xl py-6 md:py-10">
      <form action={createGroupAction} className="space-y-6">
        <header className="flex items-center gap-3">
          <BackButton href="/" label="Now" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Create group</h1>
        </header>
        <p className="text-muted">Like a group chat: everyone in it sees it and can find a time together. You’ll get a link to invite anyone else.</p>

        <label className="block space-y-1.5">
          <span className={sectionTitle}>Name</span>
          <input name="name" required maxLength={60} placeholder="e.g. ADA project, Sat climbing" autoComplete="off" data-1p-ignore data-lpignore="true" className={input("md")} autoFocus />
        </label>

        <section className="space-y-2">
          <h2 className={sectionTitle}>
            Add people <span className="normal-case font-normal tracking-normal">· optional</span>
          </h2>
          <PeopleAdder people={people.map((u) => ({ id: u.id, name: u.name, image: u.image }))} directIds={people.map((u) => u.id)} excludeIds={[user.id]} />
          <p className="text-xs text-muted">Your connections are added right away. Anyone else gets an invite they can accept or decline.</p>
        </section>

        <div className="space-y-2">
          <button type="submit" className={button("primary", "lg", "w-full")}>
            Create group
          </button>
          <p className="text-sm text-muted text-center">Everyone you add will see this group.</p>
        </div>
      </form>
    </main>
  );
}
