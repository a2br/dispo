"use client";

import { useState } from "react";
import { button, type ButtonSize, type ButtonVariant } from "@/lib/ui";

/**
 * Share sheet on phones, copy-to-clipboard elsewhere. `getUrl` lets the link be created lazily
 * (e.g. a group's share link is only minted the first time someone shares it).
 *
 * The share sheet gets a one-line message with the link at the end: it's going into a chat. The
 * clipboard gets the bare link: whoever copies it decides where it goes and what to say.
 */
/** Messages are sent as a single line: no breaks between the words and the link. */
export const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

export function ShareLinkButton({
  url,
  getUrl,
  text,
  label = "Share link",
  variant = "primary",
  size = "sm",
  className,
}: {
  url?: string;
  getUrl?: () => Promise<string | null>;
  text: string;
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "busy" | "copied" | "error">("idle");

  async function share() {
    setState("busy");
    const link = url ?? (getUrl ? await getUrl() : null);
    if (!link) return setState("error");
    if (typeof navigator.share === "function") {
      try {
        // Only `text`, with the link inside it: share targets (iMessage, WhatsApp…) put a separate
        // `url` before the text, and some Android ones add `title` on a line of its own.
        await navigator.share({ text: oneLine(`${text} ${link}`) });
        return setState("idle");
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return setState("idle");
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      window.prompt("Copy this link", link);
      setState("idle");
    }
  }

  return (
    <button type="button" onClick={share} disabled={state === "busy"} className={button(variant, size, className)}>
      {state === "copied" ? "Link copied" : state === "error" ? "Try again" : label}
    </button>
  );
}
