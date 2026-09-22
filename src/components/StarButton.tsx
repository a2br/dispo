"use client";

import { useOptimistic, useTransition } from "react";
import { setStarAction } from "@/app/actions";
import { iconButton } from "@/lib/ui";

/** Star/unstar a person or group. Starred ones are pinned to the top of lists. */
export function StarButton({ kind, id, starred, name, className }: { kind: "user" | "group"; id: string; starred: boolean; name: string; className?: string }) {
  const [on, setOn] = useOptimistic(starred);
  const [, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Unpin ${name}` : `Pin ${name} to the top`}
      title={on ? "Pinned to the top" : "Pin to the top"}
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
