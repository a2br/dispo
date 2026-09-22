import Link from "next/link";
import { ChevronRight } from "@/components/Icons";
import type { GroupWithMembers } from "@/lib/groups";
import type { Interval } from "@/lib/groupcalc";
import { fmtDayShort, fmtTime, dayStartOf } from "@/lib/time";
import { Avatar } from "./Avatar";

type Next = (Interval & { now: boolean }) | null | undefined;

function nextLabel(n: Next, now: number): { text: string; good: boolean } {
  if (n === undefined) return { text: "", good: false };
  if (n === null) return { text: "No common slot in the next 2 weeks", good: false };
  if (n.now) return { text: `Everyone free now, until ${fmtTime(n.end)}`, good: true };
  const today = dayStartOf(now);
  const day = dayStartOf(n.start);
  const when = day === today ? "Today" : day === today + 86_400_000 ? "Tomorrow" : fmtDayShort(n.start);
  return { text: `Next all free: ${when} ${fmtTime(n.start)}–${fmtTime(n.end)}`, good: false };
}

/** Your groups, each with the next time everyone is free. Tapping one opens its page. */
export function GroupCards({ groups, next, now, pinned }: { groups: GroupWithMembers[]; next: Map<string, Next>; now: number; pinned?: Set<string> }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
      {groups.map((g) => {
        const label = nextLabel(next.get(g.id), now);
        const href = `/groups/${g.id}`; // tapping a group opens it, like tapping a chat
        return (
          <li key={g.id}>
            <Link href={href} className="group flex items-center gap-3 border border-line bg-surface px-4 py-3 hover:border-foreground">
              <span className="flex gap-1 shrink-0">
                {g.members.slice(0, 3).map((m) => (
                  <Avatar key={m.id} name={m.name} image={m.image} size={28} />
                ))}
                {g.members.length > 3 && <span className="size-7 rounded-sm bg-subtle grid place-items-center text-[10px] font-bold">+{g.members.length - 3}</span>}
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2">
                  <span className="font-bold truncate group-hover:text-accent-ink">{g.name}</span>
                  {pinned?.has(g.id) && (
                    <span className="text-accent text-xs shrink-0" aria-label="Pinned" title="Pinned">
                      ★
                    </span>
                  )}
                </span>
                <span className={`block text-sm truncate ${label.good ? "text-free font-bold" : "text-muted"}`}>
                  {g.members.length === 0 ? "Nobody has joined yet" : label.text}
                </span>
              </span>
              <ChevronRight className="size-4 text-muted shrink-0" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
