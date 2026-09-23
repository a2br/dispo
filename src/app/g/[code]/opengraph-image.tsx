import { isLocale } from "@/i18n/config";
import { messages } from "@/i18n/messages";
import { groupByInviteCode } from "@/lib/invites";
import { ogSize, peopleCard, shareCard } from "@/lib/og";

// A static export, so English: a per-group alt would need generateImageMetadata, whose ids change the image URL.
export const alt = messages.en.og.group.alt;
export const size = ogSize;
export const contentType = "image/png";

// In the group creator's language: crawlers send none of their own.
export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const inv = await groupByInviteCode(code);
  if (!inv) return shareCard({ locale: "en", title: messages.en.og.group.deadTitle, subtitle: messages.en.og.group.deadSubtitle });
  const locale = isLocale(inv.owner.locale) ? inv.owner.locale : "en";
  const t = messages[locale].og.group;
  return peopleCard({
    locale,
    eyebrow: t.soFar(inv.people.length),
    title: t.join(inv.group.name),
    subtitle: t.subtitle,
    people: inv.people.map((p) => p.name),
  });
}
