import Link from "next/link";
import { button } from "@/lib/ui";
import { ShareLinkButton } from "./ShareLinkButton";

/** The two ways to bring people in: your personal link, or a group with its own link. */
export function InviteActions({ inviteUrl, primary = false }: { inviteUrl: string; primary?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ShareLinkButton url={inviteUrl} title="Join me on dispo" text="See when we’re both free between classes:" label="Share my link" variant={primary ? "primary" : "secondary"} />
      <Link href="/groups/new" className={button("secondary")}>
        Create group
      </Link>
    </div>
  );
}
