"use client";

import { useState } from "react";
import { deleteGroupAction, renameGroupAction } from "@/app/actions";
import { ConfirmAction } from "./ConfirmAction";

export function GroupTitle({ groupId, name }: { groupId: string; name: string }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <form action={async (fd) => { await renameGroupAction(fd); setEditing(false); }} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="groupId" value={groupId} />
        <input
          name="name"
          autoFocus
          required
          maxLength={60}
          defaultValue={name}
          className="min-w-0 flex-1 rounded-xl bg-surface border border-line px-3 py-1.5 text-xl font-bold tracking-tight outline-none focus:border-foreground/40"
          aria-label="Group name"
        />
        <button type="button" onClick={() => setEditing(false)} className="rounded-full border border-line px-3 py-1.5 text-sm">Cancel</button>
        <button type="submit" className="rounded-full bg-foreground text-background px-3 py-1.5 text-sm font-semibold">Save</button>
      </form>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
      <div className="flex items-center gap-2 ml-auto">
        <button type="button" onClick={() => setEditing(true)} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm active:opacity-70">
          Rename
        </button>
        <ConfirmAction
          fields={{ groupId }}
          action={deleteGroupAction}
          label="Delete"
          question="Delete this group?"
          confirmLabel="Delete"
          className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-busy active:opacity-70"
        />
      </div>
    </div>
  );
}
