import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { messages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import { appUrl, getUser } from "@/lib/auth";
import { userByInviteCode } from "@/lib/invites";
import { button } from "@/lib/ui";
import { Avatar } from "@/components/Avatar";
import { Fineprint, SignIn } from "@/components/SignIn";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import { Wordmark } from "@/components/Wordmark";

const firstName = (n: string) => n.split(" ")[0];

export async function generateMetadata({ params }: PageProps<"/i/[code]">): Promise<Metadata> {
  const { code } = await params;
  const inviter = await userByInviteCode(code);
  const t = await getT();
  if (!inviter) return { title: t.share.invite.title };
  const first = firstName(inviter.name);
  const title = t.share.invite.invitedYou(first);
  const description = t.share.invite.description(first);
  // The link preview speaks the inviter's language (crawlers send no cookie, and the inviter is the one sharing it).
  const o = messages[isLocale(inviter.locale) ? inviter.locale : "en"].share.invite;
  const og = { title: o.invitedYou(first), description: o.description(first) };
  return { title: { absolute: title }, description, openGraph: { ...og, type: "website" }, twitter: { card: "summary_large_image", ...og } };
}

/** Personal invite: "Anatole invited you". Signing in connects you with them straight away. */
export default async function PersonalInvite({ params }: PageProps<"/i/[code]">) {
  const { code } = await params;
  const inviter = await userByInviteCode(code);
  if (!inviter) notFound();
  const viewer = await getUser();
  const t = await getT();
  const first = firstName(inviter.name);
  const accept = `/i/${code}/accept`;

  if (viewer?.id === inviter.id) {
    return (
      <main className="mx-auto max-w-md py-10 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">{t.share.invite.yourLink}</h1>
        <p className="text-muted">{t.share.invite.yourLinkBlurb}</p>
        <div className="flex flex-wrap gap-2">
          <ShareLinkButton url={`${appUrl()}/i/${code}`} text={t.common.invite.text} label={t.common.invite.share} />
          <Link href="/" className={button("secondary", "sm")}>{t.share.invite.backHome}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md min-h-dvh flex flex-col justify-center py-10 gap-8">
      <Wordmark size="text-3xl" />
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={inviter.name} size={56} />
          <div>
            <p className="text-sm text-muted">{t.share.invite.from}</p>
            <p className="text-xl font-bold">{inviter.name}</p>
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{t.share.invite.headline(first)}</h1>
        <p className="text-muted">{t.share.invite.pitch}</p>
      </div>
      {viewer ? (
        <Link href={accept} prefetch={false} className={button("primary", "lg", "w-full")}>
          {t.share.invite.connect(first)}
        </Link>
      ) : (
        <SignIn next={accept} />
      )}
      <Fineprint />
    </main>
  );
}
