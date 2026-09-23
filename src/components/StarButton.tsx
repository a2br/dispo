"use client";

import { useOptimistic, useTransition } from "react";
import { setStarAction } from "@/app/actions";
import { iconButton } from "@/lib/ui";
import { useT } from "@/i18n/client";

/** Star/unstar a person or group. Starred ones are pinned to the top of lists. */
export function StarButton({ kind, id, starred, name, className }: { kind: "user" | "group"; id: string; starred: boolean; name: string; className?: string }) {
  const t = useT().people.star;
  const [on, setOn] = useOptimistic(starred);
  const [, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? t.unpin(name) : t.pin(name)}
      title={on ? t.pinnedTitle : t.pinTitle}
      onClick={() =>
        start(async () => {
          setOn(!on);
          await setStarAction(kind, id, !on);
        })
      }
      className={iconButton("secondary", "sm", `${on ? "text-accent" : "text-muted"} ${className ?? ""}`)}
    >
      {on ? "★" : "☆"}
    </button>
  );
}
