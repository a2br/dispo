import { groupByInviteCode } from "@/lib/invites";
import { ogSize, shareCard } from "@/lib/og";

export const alt = "Join a group on dispo";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const inv = await groupByInviteCode(code);
  if (!inv) return shareCard({ title: "Find a time together", subtitle: "See when everyone in your group is free." });
  const n = inv.people.length;
  return shareCard({
    eyebrow: `${n} ${n === 1 ? "person" : "people"} so far`,
    title: `Join “${inv.group.name}”`,
    subtitle: "See when everyone’s free between classes. One tap, EPFL sign-in.",
    people: inv.people.map((p) => p.name.split(" ")[0]),
  });
}
