import { ExternalLink } from "./ExternalLink";

/** Call / WhatsApp links for someone who shared a phone number. */
export function ReachLinks({ phone }: { phone: string }) {
  const digits = phone.replace(/[^\d]/g, "");
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 text-sm">
      <a href={`tel:${phone.replace(/\s/g, "")}`} className="link tabular-nums">
        {phone}
      </a>
      <ExternalLink href={`https://wa.me/${digits}`}>WhatsApp</ExternalLink>
    </span>
  );
}
