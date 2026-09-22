import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { appUrl, requireUser } from "@/lib/auth";
import { connectionsOf, statusesFor } from "@/lib/calendar";
import { getGroup } from "@/lib/groups";
import { nextCommonSlots } from "@/lib/nextSlot";
import { publicPerson } from "@/lib/present";
import { starsOf } from "@/lib/stars";
import { dayStartOf, fmtDayShort, fmtTime, nowMs } from "@/lib/time";
import { button, card, input, sectionTitle } from "@/lib/ui";
import { addMembersAction, deleteGroupAction, leaveGroupAction, renameGroupAction } from "@/app/actions";
import { BackButton } from "@/components/BackButton";
import { ConfirmAction } from "@/components/ConfirmAction";
import { PeopleChecklist } from "@/components/PeopleChecklist";
import { PersonRow } from "@/components/PersonRow";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import { StarButton } from "@/components/StarButton";

export async function generateMetadata({ params }: PageProps<"/groups/[id]">): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  const g = await getGroup(user.id, id);
  return { title: g?.name ?? "Group" };
}

/** Everything about a group lives here: who's in it, when everyone's free, the invite link, settings. */
export default async function GroupPage({ params, searchParams }: PageProps<"/groups/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  const g = await getGroup(user.id, id);
  if (!g) notFound();
  const now = nowMs();
  const others = g.people.filter((p) => p.id !== user.id);
  const [statuses, next, stars, conns] = await Promise.all([
    statusesFor(g.people.map((p) => p.id)),
    nextCommonSlots([{ id: g.id, userIds: g.people.map((p) => p.id) }], now),
    starsOf(user.id),
    connectionsOf(user.id),
  ]);
  const slot = next.get(g.id);
  const inviteUrl = `${appUrl()}/g/${g.inviteCode}`;
  const addable = conns.accepted.filter((u) => !g.people.some((p) => p.id === u.id)); // connections; others join via the link
  const calendarHref = others.length ? `/calendar?with=${others.map((p) => p.id).join(",")}` : null;
  const day = slot ? dayStartOf(slot.start) : 0;
  const today = dayStartOf(now);
  const when = slot ? (slot.now ? "now" : `${day === today ? "today" : day === today + 86_400_000 ? "tomorrow" : fmtDayShort(slot.start)} ${fmtTime(slot.start)}–${fmtTime(slot.end)}`) : null;

  return (
    <main className="mx-auto max-w-2xl py-6 md:py-10 space-y-6">
      <header className="flex items-center gap-3">
        <BackButton href="/" label="Now" />
        <h1 className="flex-1 min-w-0 text-2xl md:text-3xl font-bold tracking-tight truncate">{g.name}</h1>
        <StarButton kind="group" id={g.id} starred={stars.groups.has(g.id)} name={g.name} />
      </header>

      {sp.created === "1" && (
        <div className={`${card} p-4 space-y-2 animate-in`}>
          <p className="font-bold">Group created. Now invite the others.</p>
          <p className="text-sm text-muted">Drop the link in your group chat. Whoever opens it and signs in joins the group and gets connected with everyone in it.</p>
          <ShareLinkButton url={inviteUrl} title={`Join “${g.name}” on dispo`} text="See when everyone’s free:" label="Share invite link" size="md" />
        </div>
      )}

      <section className={`${card} p-4 flex flex-wrap items-center gap-3`}>
        <div className="flex-1 min-w-[12rem]">
          <div className={sectionTitle}>Everyone free</div>
          <div className={`text-lg font-bold ${slot?.now ? "text-free" : ""}`}>
            {others.length === 0 ? "Invite people to compare" : when ? (slot?.now ? `Now, until ${fmtTime(slot.end)}` : when[0].toUpperCase() + when.slice(1)) : "No common slot in the next 2 weeks"}
          </div>
        </div>
        {calendarHref && (
          <Link href={calendarHref} className={button(sp.created === "1" ? "secondary" : "primary", "md")}>
            Open in calendar
          </Link>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className={sectionTitle}>{g.people.length} in this group</h2>
          <ShareLinkButton url={inviteUrl} title={`Join “${g.name}” on dispo`} text="See when everyone’s free:" label="Invite link" variant="secondary" />
        </div>
        <ul className={`${card} divide-y divide-line`}>
          {g.people.map((p) => (
            <PersonRow
              key={p.id}
              person={publicPerson(p, statuses.get(p.id) ?? { state: "unknown" })}
              trailing={<span className="text-xs text-muted">{p.id === user.id ? "you" : p.id === g.ownerId ? "created it" : ""}</span>}
            />
          ))}
        </ul>
      </section>

      {addable.length > 0 && (
        <details className={card}>
          <summary className="px-4 py-3 font-bold cursor-pointer">Add your people</summary>
          <form action={addMembersAction} className="px-4 pb-4 space-y-3">
            <input type="hidden" name="groupId" value={g.id} />
            <PeopleChecklist people={addable} />
            <button type="submit" className={button("secondary", "md")}>
              Add to group
            </button>
          </form>
        </details>
      )}

      <section className="space-y-2">
        <h2 className={sectionTitle}>Settings</h2>
        <div className={`${card} p-4 space-y-4`}>
          <form action={renameGroupAction} className="flex gap-2">
            <input type="hidden" name="groupId" value={g.id} />
            <input name="name" required maxLength={60} defaultValue={g.name} aria-label="Group name" className={input("md", "flex-1 w-auto min-w-0")} />
            <button type="submit" className={button("secondary", "md")}>
              Rename
            </button>
          </form>
          <div className="flex flex-wrap gap-2">
            <ConfirmAction fields={{ groupId: g.id }} action={leaveGroupAction} label="Leave group" question="Leave this group?" confirmLabel="Leave" className={button("secondary")} />
            {g.isOwner && <ConfirmAction fields={{ groupId: g.id }} action={deleteGroupAction} label="Delete group" question="Delete it for everyone?" confirmLabel="Delete" className={button("danger")} />}
          </div>
        </div>
      </section>
    </main>
  );
}
