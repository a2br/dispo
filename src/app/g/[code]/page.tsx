import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { appUrl, getUser } from "@/lib/auth";
import { groupByInviteCode } from "@/lib/invites";
import { statusesFor } from "@/lib/calendar";
import { publicPerson } from "@/lib/present";
import { button, sectionTitle } from "@/lib/ui";
import { leaveGroupAction } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { BackButton } from "@/components/BackButton";
import { PersonRow } from "@/components/PersonRow";
import { Fineprint, SignIn } from "@/components/SignIn";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import { Wordmark } from "@/components/Wordmark";
import { StarButton } from "@/components/StarButton";
import { starsOf } from "@/lib/stars";

const firstName = (n: string) => n.split(" ")[0];

export async function generateMetadata({ params }: PageProps<"/g/[code]">): Promise<Metadata> {
  const { code } = await params;
  const inv = await groupByInviteCode(code);
  if (!inv) return { title: "Group" };
  const n = inv.people.length;
  const title = `Join “${inv.group.name}” on dispo`;
  const description = `${firstName(inv.owner.name)} and ${n - 1 === 0 ? "you" : `${n - 1} other${n - 1 === 1 ? "" : "s"}`}: see when everyone is free between classes. Sign in with your EPFL account.`;
  return { title: { absolute: title }, description, openGraph: { title, description, type: "website" }, twitter: { card: "summary_large_image", title, description } };
}

/**
 * Group link, made for group chats. Visitors sign in and land in the group's calendar, connected
 * with everyone already in it. Members see the group's page: who's in, share link, open calendar.
 */
export default async function GroupInvitePage({ params }: PageProps<"/g/[code]">) {
  const { code } = await params;
  const inv = await groupByInviteCode(code);
  if (!inv) notFound();
  const viewer = await getUser();
  const join = `/g/${code}/join`;
  const url = `${appUrl()}/g/${code}`;
  const isMember = viewer ? inv.people.some((p) => p.id === viewer.id) : false;
  const isOwner = viewer?.id === inv.owner.id;
  const names = inv.people.map((p) => firstName(p.name));

  if (viewer && isMember) {
    const others = inv.people.filter((p) => p.id !== viewer.id);
    const statuses = await statusesFor(inv.people.map((p) => p.id));
    const starred = (await starsOf(viewer.id)).groups.has(inv.group.id);
    return (
      <main className="mx-auto max-w-2xl py-6 md:py-10 space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <BackButton href="/" label="Now" />
            <h1 className="flex-1 text-2xl md:text-3xl font-bold tracking-tight truncate">{inv.group.name}</h1>
            <StarButton kind="group" id={inv.group.id} starred={starred} name={inv.group.name} />
          </div>
          <p className="text-sm text-muted">
            Anyone with the link can join. Joining connects them with everyone here. {isOwner ? "You created this group." : `Created by ${firstName(inv.owner.name)}.`}
          </p>
        </header>
        <div className="flex flex-wrap gap-2">
          <ShareLinkButton url={url} title={`Join “${inv.group.name}” on dispo`} text="See when everyone’s free:" label="Share link" size="md" />
          {others.length > 0 && (
            <Link href={`/calendar?with=${others.map((p) => p.id).join(",")}`} className={button("secondary", "md")}>
              Open in calendar
            </Link>
          )}
        </div>
        <section>
          <h2 className={`${sectionTitle} mb-2`}>{inv.people.length} in this group</h2>
          <ul className="border border-line divide-y divide-line">
            {inv.people.map((p) => (
              <PersonRow key={p.id} person={publicPerson(p, statuses.get(p.id) ?? { state: "unknown" })} trailing={p.id === inv.owner.id ? <span className="text-xs text-muted">created it</span> : undefined} />
            ))}
          </ul>
          {others.length === 0 && <p className="mt-2 text-sm text-muted">Nobody has joined yet. Drop the link in your group chat.</p>}
        </section>
        {!isOwner && (
          <form action={leaveGroupAction}>
            <input type="hidden" name="groupId" value={inv.group.id} />
            <button className={button("danger", "sm", "-ml-3")}>Leave group</button>
          </form>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md min-h-dvh flex flex-col justify-center py-10 gap-8">
      <Wordmark size="text-3xl" />
      <div className="space-y-4">
        <div className="flex -space-x-1">
          {inv.people.slice(0, 6).map((p) => (
            <span key={p.id} className="ring-2 ring-background rounded-sm">
              <Avatar name={p.name} image={p.image} size={44} />
            </span>
          ))}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Join “{inv.group.name}”</h1>
        <p className="text-muted">
          {names.slice(0, 3).join(", ")}
          {names.length > 3 ? ` and ${names.length - 3} more` : ""} {names.length === 1 ? "is" : "are"} here. Sign in once and you’ll see when everyone’s free, connected with the whole group.
        </p>
      </div>
      {viewer ? (
        <Link href={join} prefetch={false} className={button("primary", "lg", "w-full")}>
          Join the group
        </Link>
      ) : (
        <SignIn next={join} />
      )}
      <Fineprint />
    </main>
  );
}
