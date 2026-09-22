import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { connectionsOf } from "@/lib/calendar";
import { starsOf } from "@/lib/stars";
import { button, input, sectionTitle } from "@/lib/ui";
import { createGroupAction } from "@/app/actions";
import { BackButton } from "@/components/BackButton";
import { PeopleChecklist } from "@/components/PeopleChecklist";

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
          <input name="name" required maxLength={60} placeholder="e.g. ADA project, Sat climbing" className={input("md")} autoFocus />
        </label>

        <section className="space-y-2">
          <h2 className={sectionTitle}>Add your people {people.length > 0 && <span className="normal-case font-normal tracking-normal">· optional</span>}</h2>
          {people.length ? (
            <PeopleChecklist people={people} />
          ) : (
            <p className="text-sm text-muted border border-line px-4 py-4">You’re not connected with anyone yet. Create the group and share its link instead.</p>
          )}
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
