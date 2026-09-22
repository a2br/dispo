import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { groupByInviteCode } from "@/lib/invites";
import { button } from "@/lib/ui";
import { Avatar } from "@/components/Avatar";
import { Fineprint, SignIn } from "@/components/SignIn";
import { Wordmark } from "@/components/Wordmark";

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
  const isMember = viewer ? inv.people.some((p) => p.id === viewer.id) : false;
  const names = inv.people.map((p) => firstName(p.name));

  if (viewer && isMember) redirect(`/groups/${inv.group.id}`);

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
