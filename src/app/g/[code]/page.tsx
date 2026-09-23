import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { groupByInviteCode } from "@/lib/invites";
import { button } from "@/lib/ui";
import { Avatar } from "@/components/Avatar";
import { Fineprint, SignIn } from "@/components/SignIn";
import { Wordmark } from "@/components/Wordmark";
import { LOCALE_TAGS } from "@/i18n/config";
import { getLocale, getT } from "@/i18n/server";

const firstName = (n: string) => n.split(" ")[0];

export async function generateMetadata({ params }: PageProps<"/g/[code]">): Promise<Metadata> {
  const { code } = await params;
  const [inv, t] = await Promise.all([groupByInviteCode(code), getT()]);
  if (!inv) return { title: t.groups.fallbackTitle };
  const title = t.groups.invite.metaTitle(inv.group.name);
  const description = t.groups.invite.metaDescription(firstName(inv.owner.name), inv.people.length - 1);
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
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const ti = t.groups.invite;
  const shown = [...names.slice(0, 3), ...(names.length > 3 ? [ti.more(names.length - 3)] : [])];

  return (
    <main className="mx-auto max-w-md min-h-dvh flex flex-col justify-center py-10 gap-8">
      <Wordmark size="text-3xl" />
      <div className="space-y-4">
        <div className="flex -space-x-1">
          {inv.people.slice(0, 6).map((p) => (
            <span key={p.id} className="ring-2 ring-background rounded-sm">
              <Avatar name={p.name} size={44} />
            </span>
          ))}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{ti.title(inv.group.name)}</h1>
        <p className="text-muted">
          {ti.here(new Intl.ListFormat(LOCALE_TAGS[locale], { type: "conjunction" }).format(shown), names.length)} {ti.pitch}
        </p>
      </div>
      {viewer ? (
        <Link href={join} prefetch={false} className={button("primary", "lg", "w-full")}>
          {ti.join}
        </Link>
      ) : (
        <SignIn next={join} />
      )}
      <Fineprint />
    </main>
  );
}
