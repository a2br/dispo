"use client";

import { useState } from "react";
import { GroupLinkForm } from "./GroupLinkForm";
import { ShareLinkButton } from "./ShareLinkButton";

/** The two ways to bring people in. While a group link is being named, only that form shows. */
export function InviteActions({ inviteUrl, primary = false }: { inviteUrl: string; primary?: boolean }) {
  const [groupOpen, setGroupOpen] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      {!groupOpen && (
        <ShareLinkButton url={inviteUrl} title="Join me on dispo" text="See when we’re both free between classes:" label="Share my link" variant={primary ? "primary" : "secondary"} />
      )}
      <GroupLinkForm onOpenChange={setGroupOpen} />
    </div>
  );
}
