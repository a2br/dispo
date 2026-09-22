import Link from "next/link";
import type { Status } from "@/lib/calendar";
import type { GroupWithMembers } from "@/lib/groups";
import { Avatar } from "./Avatar";

/** One tap into a saved group's availability. Shows how many members are free right now. */
export function GroupCards({ groups, statuses, you }: { groups: GroupWithMembers[]; statuses: Map<string, Status>; you: Status }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
      {groups.map((g) => {
        const all = [you, ...g.members.map((m) => statuses.get(m.id) ?? ({ state: "unknown" } as const))];
        const known = all.filter((s) => s.state !== "unknown");
        const free = known.filter((s) => s.state === "free").length;
        const everyone = known.length > 0 && free === known.length;
        return (
          <li key={g.id}>
            <Link href={`/calendar?g=${g.id}`} className="flex items-center gap-3 rounded-2xl bg-surface border border-line px-4 py-3 active:opacity-70 hover:border-foreground/25 transition-colors">
              <span className="flex -space-x-2 shrink-0">
                {g.members.slice(0, 3).map((m) => (
                  <span key={m.id} className="rounded-full ring-2 ring-surface">
                    <Avatar name={m.name} image={m.image} size={28} />
                  </span>
                ))}
                {g.members.length > 3 && (
                  <span className="size-7 rounded-full ring-2 ring-surface bg-line grid place-items-center text-[10px] font-semibold">+{g.members.length - 3}</span>
                )}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-medium truncate">{g.name}</span>
                <span className={`block text-sm ${everyone ? "text-free font-medium" : "text-muted"}`}>
                  {g.members.length === 0 ? "No members yet" : everyone ? "Everyone free now" : `${free} of ${known.length} free now`}
                </span>
              </span>
              <span aria-hidden className="text-muted">›</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
