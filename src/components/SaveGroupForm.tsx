"use client";

import { useState } from "react";
import { createGroupAction } from "@/app/actions";

export function SaveGroupForm({ memberIds, suggestion }: { memberIds: string[]; suggestion: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium active:opacity-70">
        ☆ Save as group
      </button>
    );
  }
  return (
    <form action={createGroupAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="members" value={memberIds.join(",")} />
      <input
        name="name"
        autoFocus
        required
        maxLength={60}
        defaultValue={suggestion}
        onFocus={(e) => e.currentTarget.select()}
        className="min-w-0 flex-1 rounded-full bg-surface border border-line px-3 py-1.5 text-sm outline-none focus:border-foreground/40"
        aria-label="Group name"
      />
      <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-line px-3 py-1.5 text-sm">
        Cancel
      </button>
      <button type="submit" className="rounded-full bg-foreground text-background px-3 py-1.5 text-sm font-semibold">
        Save
      </button>
    </form>
  );
}
