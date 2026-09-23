"use client";

import { useState } from "react";
import { button } from "@/lib/ui";
import { oneLine } from "./ShareLinkButton";
import { useT } from "@/i18n/client";

/**
 * Opens the phone's share sheet (or an email draft on desktop) with an invite written by the viewer, in their language.
 * Nothing is sent by the app itself. Unlike ShareLinkButton, the clipboard gets the whole message:
 * it's addressed to one person and meant to be pasted as is. Always one line, link last.
 */
export function InviteButton({ firstName, email, inviteUrl }: { firstName: string; email: string; inviteUrl?: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  async function invite() {
    const url = inviteUrl ?? window.location.origin; // personal link: signing up connects them with you
    const text = oneLine(t.people.invite.message(firstName, url));
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    const mailto = `mailto:${encodeURIComponent(email)}?${new URLSearchParams({ subject: t.people.invite.subject, body: text }).toString().replace(/\+/g, "%20")}`;
    window.location.href = mailto;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the email draft is enough */
    }
  }

  return (
    <button type="button" onClick={invite} className={button("secondary")}>
      {copied ? t.people.invite.copied : t.common.invite.short}
    </button>
  );
}
