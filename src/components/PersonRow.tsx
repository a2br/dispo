import Link from "next/link";
import type { PersonView } from "@/lib/present";
import { Avatar } from "./Avatar";
import { StatusPill } from "./StatusPill";

export function PersonRow({
  person,
  trailing,
  footer,
  pinned = false,
  dim = false,
}: {
  person: PersonView;
  trailing?: React.ReactNode;
  footer?: React.ReactNode;
  pinned?: boolean;
  dim?: boolean; // busy people are shown after free ones, greyed out
}) {
  return (
    <li className={`px-4 py-3 transition-opacity ${dim ? "opacity-55 hover:opacity-100" : ""}`}>
      <div className="flex items-center gap-3">
        <Link href={`/u/${person.id}`} className="group flex items-center gap-3 flex-1 min-w-0 active:opacity-70">
          <Avatar name={person.name} image={person.image} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold truncate group-hover:text-accent-ink transition-colors">{person.name}</span>
              {pinned && (
                <span className="text-accent text-xs shrink-0" aria-label="Pinned" title="Pinned">
                  ★
                </span>
              )}
            </div>
            <StatusPill status={person.status} />
          </div>
        </Link>
        {trailing}
      </div>
      {footer && <div className="mt-1.5 pl-[3.25rem]">{footer}</div>}
    </li>
  );
}
