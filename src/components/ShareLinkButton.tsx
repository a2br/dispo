"use client";

import { useState } from "react";
import { button, type ButtonSize, type ButtonVariant } from "@/lib/ui";

/**
 * Share sheet on phones, copy-to-clipboard elsewhere. `getUrl` lets the link be created lazily
 * (e.g. a group's share link is only minted the first time someone shares it).
 */
export function ShareLinkButton({
  url,
  getUrl,
  title,
  text,
  label = "Share link",
  variant = "primary",
  size = "sm",
  className,
}: {
  url?: string;
  getUrl?: () => Promise<string | null>;
  title: string;
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
        await navigator.share({ title, text, url: link });
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
