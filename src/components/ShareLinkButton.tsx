"use client";

import { useState } from "react";
import { useT } from "@/i18n/client";
import { button, type ButtonSize, type ButtonVariant } from "@/lib/ui";

/**
 * Share sheet on phones, copy-to-clipboard elsewhere. `getUrl` lets the link be created lazily
 * (e.g. a group's share link is only minted the first time someone shares it).
 *
 * The share sheet gets a one-line message with the link at the end: it's going into a chat. The
 * clipboard gets the bare link: whoever copies it decides where it goes and what to say.
 */
/** Messages are sent as a single line: no breaks between the words and the link. */
// Narrow no-break spaces stay: French puts them before ":" and "?" so the mark never starts a line.
export const oneLine = (s: string) => s.replace(/[^\S\u202f]+/g, " ").trim();

export function ShareLinkButton({
  url,
  getUrl,
  text,
  label,
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
  const t = useT().pages.share;
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
      window.prompt(t.prompt, link);
      setState("idle");
    }
  }

  return (
    <button type="button" onClick={share} disabled={state === "busy"} className={button(variant, size, className)}>
      {state === "copied" ? t.copied : state === "error" ? t.retry : (label ?? t.label)}
    </button>
  );
}
