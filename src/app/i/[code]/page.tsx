import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
  if (!inviter) return { title: "Invite" };
  const title = `${firstName(inviter.name)} invited you to dispo`;
  const description = `See when you and ${firstName(inviter.name)} are both free between classes. Sign in with your EPFL account.`;
  return { title: { absolute: title }, description, openGraph: { title, description, type: "website" }, twitter: { card: "summary_large_image", title, description } };
}

/** Personal invite: "Anatole invited you". Signing in connects you with them straight away. */
export default async function PersonalInvite({ params }: PageProps<"/i/[code]">) {
  const { code } = await params;
  const inviter = await userByInviteCode(code);
  if (!inviter) notFound();
  const viewer = await getUser();
  const first = firstName(inviter.name);
  const accept = `/i/${code}/accept`;

  if (viewer?.id === inviter.id) {
    return (
      <main className="mx-auto max-w-md py-10 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">This is your invite link</h1>
        <p className="text-muted">Anyone at EPFL who opens it and signs in is connected with you right away, so you’ll see each other’s free time.</p>
        <div className="flex flex-wrap gap-2">
          <ShareLinkButton url={`${appUrl()}/i/${code}`} text="See when we’re both free between classes:" label="Share my link" />
          <Link href="/" className={button("secondary", "sm")}>Back to dispo</Link>
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
            <p className="text-sm text-muted">Invitation from</p>
            <p className="text-xl font-bold">{inviter.name}</p>
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">See when you and {first} are both free.</h1>
        <p className="text-muted">dispo shows your EPFL timetables side by side, so finding a gap for lunch or a project meeting takes one look.</p>
      </div>
      {viewer ? (
        <Link href={accept} prefetch={false} className={button("primary", "lg", "w-full")}>
          Connect with {first}
        </Link>
      ) : (
        <SignIn next={accept} label={`Continue with EPFL Google`} />
      )}
      <Fineprint />
    </main>
  );
}
