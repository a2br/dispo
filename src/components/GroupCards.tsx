import Link from "next/link";
import { ChevronRight } from "@/components/Icons";
import type { GroupWithMembers } from "@/lib/groups";
import type { Interval } from "@/lib/groupcalc";
import { fmtDayShort, fmtTime, dayStartOf } from "@/lib/time";
import { Avatar } from "./Avatar";
import { getLocale, getT } from "@/i18n/server";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/i18n/config";

type Next = (Interval & { now: boolean }) | null | undefined;

function nextLabel(n: Next, now: number, t: Messages["now"]["groupCard"], locale: Locale): { text: string; good: boolean } {
  if (n === undefined) return { text: "", good: false };
  if (n === null) return { text: t.noSlot, good: false };
  if (n.now) return { text: t.freeNow(fmtTime(n.end)), good: true };
  const today = dayStartOf(now);
  const day = dayStartOf(n.start);
  const range = `${fmtTime(n.start)}–${fmtTime(n.end)}`;
  const text = day === today ? t.freeToday(range) : day === today + 86_400_000 ? t.freeTomorrow(range) : t.freeOn(fmtDayShort(n.start, locale), range);
  return { text, good: false };
}

/** Your groups, each with the next time everyone is free. Tapping one opens its page. */
export async function GroupCards({ groups, next, now, pinned, locked = false }: { groups: GroupWithMembers[]; next: Map<string, Next>; now: number; pinned?: Set<string>; locked?: boolean }) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
      {groups.map((g) => {
        const label = nextLabel(next.get(g.id), now, t.now.groupCard, locale);
        const href = `/groups/${g.id}`; // tapping a group opens it, like tapping a chat
        return (
          <li key={g.id} className="min-w-0">
            <Link href={href} className="group flex items-center gap-3 border border-line bg-surface px-4 py-3 hover:border-foreground">
              <span className="flex gap-1 shrink-0">
                {g.members.slice(0, 3).map((m) => (
                  <Avatar key={m.id} name={m.name} size={28} />
                ))}
                {g.members.length > 3 && <span className="size-7 rounded-sm bg-subtle grid place-items-center text-[10px] font-bold">+{g.members.length - 3}</span>}
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2">
                  <span className="font-bold truncate group-hover:text-accent-ink">{g.name}</span>
                  {pinned?.has(g.id) && (
                    <span className="text-accent text-xs shrink-0" aria-label={t.common.pinned} title={t.common.pinned}>
                      ★
                    </span>
                  )}
                </span>
                <span className={`block text-sm truncate ${label.good ? "text-free font-bold" : "text-muted"}`}>
                  {g.members.length === 0 ? t.now.groupCard.empty : locked ? t.now.groupCard.locked : label.text}
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
