"use client";

import { useState } from "react";
import { createGroupLinkAction } from "@/app/actions";
import { button, input } from "@/lib/ui";

/** "Plan with a group chat": name a group, get a link, drop it in the chat. */
export function GroupLinkForm({ variant = "secondary", onOpenChange }: { variant?: "primary" | "secondary"; onOpenChange?: (open: boolean) => void }) {
  const [open, setOpenState] = useState(false);
  const setOpen = (v: boolean) => {
    setOpenState(v);
    onOpenChange?.(v);
  };
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className={button(variant)}>
        Group chat link
      </button>
    );
  return (
    <form action={createGroupLinkAction} className="basis-full flex flex-wrap items-center gap-2 animate-in">
      <input name="name" required autoFocus maxLength={60} placeholder="Group name, e.g. ADA project" aria-label="Group name" className={input("sm", "flex-1 min-w-[10rem] w-auto")} />
      <button type="button" onClick={() => setOpen(false)} className={button("quiet")}>
        Cancel
      </button>
      <button type="submit" className={button("dark")}>
        Create link
      </button>
      <span className="basis-full text-xs text-muted">Anyone who opens the link and signs in joins the group and gets connected with everyone in it.</span>
    </form>
  );
}
