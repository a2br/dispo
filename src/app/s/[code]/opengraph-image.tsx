import { userByShareCode } from "@/lib/invites";
import { ogSize, shareCard } from "@/lib/og";

export const alt = "A week on dispo";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const owner = await userByShareCode(code);
  const first = owner ? owner.name.split(" ")[0] : "Someone";
  return shareCard({ eyebrow: "Free / busy", title: `${first}’s week`, subtitle: "See when they’re free. Open it, no sign-up needed." });
}
