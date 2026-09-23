import { isLocale } from "@/i18n/config";
import { messages } from "@/i18n/messages";
import { userByInviteCode } from "@/lib/invites";
import { ogSize, peopleCard, shareCard } from "@/lib/og";

// A static export, so English: a per-inviter alt would need generateImageMetadata, whose ids change the image URL.
export const alt = messages.en.og.invite.alt;
export const size = ogSize;
export const contentType = "image/png";

// First names and initials only: share previews are public to anyone holding the link.
// In the inviter's language: crawlers send none of their own, and it's the inviter speaking.
export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const inviter = await userByInviteCode(code);
  if (!inviter) {
    const t = messages.en.og.invite;
    return shareCard({ locale: "en", eyebrow: t.eyebrow, title: t.title, subtitle: t.subtitle });
  }
  const locale = isLocale(inviter.locale) ? inviter.locale : "en";
  const t = messages[locale].og.invite;
  const first = inviter.name.split(" ")[0];
  return peopleCard({ locale, eyebrow: t.eyebrow, title: t.titleFrom(first), subtitle: t.subtitle, people: [inviter.name] });
}
