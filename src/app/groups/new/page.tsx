import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { connectionsOf } from "@/lib/calendar";
import { starsOf } from "@/lib/stars";
import { button, input, sectionTitle } from "@/lib/ui";
import { createGroupAction } from "@/app/actions";
import { BackButton } from "@/components/BackButton";
import { PeopleAdder } from "@/components/PeopleAdder";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).groups.create.title };
}

/** The one way to make a group, always on purpose: name it, pick people (optional), get its invite link. */
export default async function CreateGroupPage() {
  const user = await requireUser();
  const t = await getT();
  const tc = t.groups.create;
  const [conns, stars] = await Promise.all([connectionsOf(user.id), starsOf(user.id)]);
  const people = [...conns.accepted].sort((a, b) => Number(stars.users.has(b.id)) - Number(stars.users.has(a.id)) || a.name.localeCompare(b.name));

  return (
    <main className="mx-auto max-w-xl py-6 md:py-10">
      <form action={createGroupAction} className="space-y-6">
        <header className="flex items-center gap-3">
          <BackButton href="/" label={t.nav.now} />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{tc.title}</h1>
        </header>
        <p className="text-muted">{tc.intro}</p>

        <label className="block space-y-1.5">
          <span className={sectionTitle}>{tc.name}</span>
          <input name="name" required maxLength={60} placeholder={tc.namePlaceholder} autoComplete="off" data-1p-ignore data-lpignore="true" className={input("md")} autoFocus />
        </label>

        <section className="space-y-2">
          <h2 className={sectionTitle}>
            {tc.addPeople} <span className="normal-case font-normal tracking-normal">· {tc.optional}</span>
          </h2>
          <PeopleAdder people={people.map((u) => ({ id: u.id, name: u.name }))} directIds={people.map((u) => u.id)} excludeIds={[user.id]} />
          <p className="text-xs text-muted">{tc.hint}</p>
        </section>

        <div className="space-y-2">
          <button type="submit" className={button("primary", "lg", "w-full")}>
            {tc.submit}
          </button>
          <p className="text-sm text-muted text-center">{tc.everyoneSees}</p>
        </div>
      </form>
    </main>
  );
}
