import { messages } from "@/i18n/messages";
import { ogSize, shareCard } from "@/lib/og";

// No one is sharing this link in particular, so English, the default.
const t = messages.en.og.home;

export const alt = t.alt;
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return shareCard({ locale: "en", title: t.title, subtitle: t.subtitle });
}
