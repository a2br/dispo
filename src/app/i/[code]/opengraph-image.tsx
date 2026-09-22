import { userByInviteCode } from "@/lib/invites";
import { ogSize, shareCard } from "@/lib/og";

export const alt = "An invitation to dispo";
export const size = ogSize;
export const contentType = "image/png";

// First names only: share previews are public to anyone holding the link.
export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const inviter = await userByInviteCode(code);
  const first = inviter ? inviter.name.split(" ")[0] : "A friend";
  return shareCard({ eyebrow: "You’re invited", title: `${first} wants to see when you’re both free`, subtitle: "EPFL timetables side by side. Sign in once with your EPFL account." });
}
