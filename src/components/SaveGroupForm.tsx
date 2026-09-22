"use client";

import { useState } from "react";
import { button, input } from "@/lib/ui";
import { createGroupAction } from "@/app/actions";

export function SaveGroupForm({ memberIds, suggestion }: { memberIds: string[]; suggestion: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={button("secondary")}>
        ☆ Save as group
      </button>
    );
  }
  return (
    <form action={createGroupAction} className="flex flex-wrap items-center gap-2 animate-in">
      <input type="hidden" name="members" value={memberIds.join(",")} />
      <input
        name="name"
        autoFocus
        required
        maxLength={60}
        defaultValue={suggestion}
        onFocus={(e) => e.currentTarget.select()}
        className={input("sm", "min-w-0 flex-1 w-auto")}
        aria-label="Group name"
      />
      <button type="button" onClick={() => setOpen(false)} className={button("quiet")}>
        Cancel
      </button>
      <button type="submit" className={button("dark")}>
        Save
      </button>
      <span className="basis-full text-xs text-muted">Groups are private shortcuts: only you see them, and nobody is notified.</span>
    </form>
  );
}
