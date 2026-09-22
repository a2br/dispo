"use client";

import { useState } from "react";

/**
 * Opens the phone's share sheet (or an email draft on desktop) with an invite written by the viewer.
 * Nothing is sent by the app itself.
 */
export function InviteButton({ firstName, email }: { firstName: string; email: string }) {
  const [copied, setCopied] = useState(false);

  async function invite() {
    const url = window.location.origin;
    const text = `Hey ${firstName}! I'm using dispo to see when friends are free between classes. Sign in with your EPFL account and paste your Campus calendar link once: ${url}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Join me on dispo", text });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    const mailto = `mailto:${encodeURIComponent(email)}?${new URLSearchParams({ subject: "Join me on dispo", body: text }).toString().replace(/\+/g, "%20")}`;
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
    <button type="button" onClick={invite} className="rounded-full border border-accent text-accent px-3 py-1.5 text-sm font-semibold whitespace-nowrap active:opacity-70">
      {copied ? "Copied" : "Invite"}
    </button>
  );
}
