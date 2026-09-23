import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { appUrl, requireUser } from "@/lib/auth";
import { hasSchedule, visibleStatuses } from "@/lib/access";
import { connectionsOf } from "@/lib/calendar";
import { getGroup, pendingInvitees } from "@/lib/groups";
import { nextCommonSlots } from "@/lib/nextSlot";
import { publicPerson } from "@/lib/present";
import { starsOf } from "@/lib/stars";
import { dayStartOf, fmtDayLong, fmtDayShort, fmtTime, nowMs } from "@/lib/time";
import { button, card, input, sectionTitle } from "@/lib/ui";
import { addMembersAction, cancelInviteAction, deleteGroupAction, leaveGroupAction, renameGroupAction } from "@/app/actions";
import { BackButton } from "@/components/BackButton";
import { ConfirmAction } from "@/components/ConfirmAction";
import { PeopleAdder } from "@/components/PeopleAdder";
import { Avatar } from "@/components/Avatar";
import { PersonRow } from "@/components/PersonRow";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import { StarButton } from "@/components/StarButton";
import { getLocale, getT } from "@/i18n/server";

export async function generateMetadata({ params }: PageProps<"/groups/[id]">): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  const g = await getGroup(user.id, id);
  return { title: g?.name ?? (await getT()).groups.fallbackTitle };
}

/** Everything about a group lives here: who's in it, when everyone's free, the invite link, settings. */
export default async function GroupPage({ params, searchParams }: PageProps<"/groups/[id]">) {
  const user = await requireUser();
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const tg = t.groups.page;
  const { id } = await params;
  const sp = await searchParams;
  const g = await getGroup(user.id, id);
  if (!g) notFound();
  const now = nowMs();
  const others = g.people.filter((p) => p.id !== user.id);
  const [statuses, next, stars, conns, invited] = await Promise.all([
    visibleStatuses(user, g.people),
    nextCommonSlots([{ id: g.id, userIds: g.people.map((p) => p.id) }], now),
    starsOf(user.id),
    connectionsOf(user.id),
    pendingInvitees(g.id),
  ]);
  const mine = await hasSchedule(user.id);
  const slot = mine ? next.get(g.id) : undefined;
  const inviteUrl = `${appUrl()}/g/${g.inviteCode}`;
  const addable = conns.accepted.filter((u) => !g.people.some((p) => p.id === u.id)); // connections; others join via the link
  const calendarHref = others.length ? `/calendar?with=${others.map((p) => p.id).join(",")}` : null;
  const day = slot ? dayStartOf(slot.start) : 0;
  const today = dayStartOf(now);
  const range = slot ? `${fmtTime(slot.start)}–${fmtTime(slot.end)}` : "";
  const when = !slot
    ? null
    : slot.now
      ? tg.nowUntil(fmtTime(slot.end))
      : day === today
        ? tg.slotToday(range)
        : day === today + 86_400_000
          ? tg.slotTomorrow(range)
          : tg.slotDay({ short: fmtDayShort(slot.start, locale), long: fmtDayLong(slot.start, locale) }, range);

  return (
    <main className="mx-auto max-w-2xl py-6 md:py-10 space-y-6">
      <header className="flex items-center gap-3">
        <BackButton href="/" label={t.nav.now} />
        <h1 className="flex-1 min-w-0 text-2xl md:text-3xl font-bold tracking-tight truncate">{g.name}</h1>
        <StarButton kind="group" id={g.id} starred={stars.groups.has(g.id)} name={g.name} />
      </header>

      {sp.created === "1" && (
        <div className={`${card} p-4 space-y-2 animate-in`}>
          <p className="font-bold">{tg.created}</p>
          <p className="text-sm text-muted">{tg.createdHint}</p>
          <ShareLinkButton url={inviteUrl} text={tg.shareText} label={tg.shareInvite} />
        </div>
      )}

      <section className={`${card} p-4 flex flex-wrap items-center gap-3`}>
        <div className="flex-1 min-w-[12rem]">
          <div className={sectionTitle}>{tg.everyoneFree}</div>
          <div className={`text-lg font-bold ${slot?.now ? "text-free" : ""}`}>
            {!mine ? tg.addScheduleToCompare : others.length === 0 ? tg.inviteToCompare : (when ?? tg.noSlot)}
          </div>
        </div>
        {!mine ? (
          <Link href={`/setup?next=${encodeURIComponent(`/groups/${g.id}`)}`} className={button("primary")}>
            {tg.addSchedule}
          </Link>
        ) : (
          calendarHref && (
            <Link href={calendarHref} className={button(sp.created === "1" ? "secondary" : "primary")}>
              {tg.openCalendar}
            </Link>
          )
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className={sectionTitle}>{tg.count(g.people.length)}</h2>
          <ShareLinkButton url={inviteUrl} text={tg.shareText} label={tg.inviteLink} variant="secondary" />
        </div>
        <ul className={`${card} divide-y divide-line`}>
          {g.people.map((p) => (
            <PersonRow
              key={p.id}
              person={publicPerson(p, statuses.get(p.id) ?? { state: "unknown" }, t)}
              trailing={<span className="text-xs text-muted">{p.id === user.id ? tg.you : p.id === g.ownerId ? tg.creator : ""}</span>}
            />
          ))}
        </ul>
      </section>

      {invited.length > 0 && (
        <section className="space-y-2">
          <h2 className={sectionTitle}>{tg.invited}</h2>
          <ul className={`${card} divide-y divide-line`}>
            {invited.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2.5 opacity-70">
                <Avatar name={p.name} size={32} />
                <span className="flex-1 min-w-0 truncate font-bold">{p.name}</span>
                <form action={cancelInviteAction}>
                  <input type="hidden" name="groupId" value={g.id} />
                  <input type="hidden" name="userId" value={p.id} />
                  <button className={button("quiet")}>{t.common.cancel}</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <details className={card}>
        <summary className="px-4 py-3 font-bold cursor-pointer">{tg.addPeople}</summary>
        <form action={addMembersAction} className="px-4 pb-4 space-y-3">
          <input type="hidden" name="groupId" value={g.id} />
          <PeopleAdder
            people={addable.map((u) => ({ id: u.id, name: u.name }))}
            directIds={conns.accepted.map((u) => u.id)}
            excludeIds={[...g.people.map((p) => p.id), ...invited.map((p) => p.id)]}
          />
          <p className="text-xs text-muted">{tg.addHint}</p>
          <button type="submit" className={button("secondary")}>
            {tg.addSubmit}
          </button>
        </form>
      </details>

      <section className="space-y-2">
        <h2 className={sectionTitle}>{tg.settings}</h2>
        <div className={`${card} p-4 space-y-2`}>
          <form action={renameGroupAction} className="flex gap-2">
            <input type="hidden" name="groupId" value={g.id} />
            <input name="name" required maxLength={60} defaultValue={g.name} aria-label={tg.nameLabel} autoComplete="off" data-1p-ignore data-lpignore="true" className={input("sm", "flex-1 w-auto min-w-0")} />
            <button type="submit" className={button("secondary")}>
              {tg.rename}
            </button>
          </form>
          <div className="flex flex-wrap gap-2">
            <ConfirmAction fields={{ groupId: g.id }} action={leaveGroupAction} label={tg.leave} question={tg.leaveQuestion} confirmLabel={tg.leaveConfirm} className={button("secondary")} />
            {g.isOwner && <ConfirmAction fields={{ groupId: g.id }} action={deleteGroupAction} label={tg.delete} question={tg.deleteQuestion} confirmLabel={tg.deleteConfirm} className={button("danger")} />}
          </div>
        </div>
      </section>
    </main>
  );
}
