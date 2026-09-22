import Link from "next/link";
import type { PersonView } from "@/lib/present";
import { Avatar } from "./Avatar";
import { StatusPill } from "./StatusPill";

export function PersonRow({ person, trailing, footer }: { person: PersonView; trailing?: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <li className="px-4 py-3">
      <div className="flex items-center gap-3">
        <Link href={`/u/${person.id}`} className="flex items-center gap-3 flex-1 min-w-0 active:opacity-70">
          <Avatar name={person.name} image={person.image} />
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{person.name}</div>
            <StatusPill status={person.status} />
          </div>
        </Link>
        {trailing}
      </div>
      {footer && <div className="mt-1.5 pl-[3.25rem]">{footer}</div>}
    </li>
  );
}
